import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { JwtPayload } from "../../interface/global";
import { IFileFields } from "./cook.controller";
import { ICookAvailability, ICookProfile, ILocation } from "./cook.interface";
import { sendFileToCloudinary } from "../../utils/sendImageToCloudinary";
import mongoose, { Types } from "mongoose";
import { UserModel } from "../User/user.model";
import { CookAvailabilityModel, CookProfileModel } from "./cook.model";
import { emitCookLocationUpdate } from "../../utils/socket";
import { ReviewModel } from "../Review/review.model";
import { MealModel } from "../Meal/meal.model";
import { getAddressFromCoordinates } from "./cook.utils";
// import { latLngToAddress } from "./cook.utils";

const becomeACook = async (
  cook: ICookProfile, // Cook profile data
  user: JwtPayload, // User information
  files: IFileFields, // Files (profile image, kitchen images)
) => {
  const userId = new Types.ObjectId(user.user);
  const { profileImage, kitchenImages, certificates } = files;

  // Check if the required images are provided
  if (!profileImage || !kitchenImages) {
    throw new AppError(HttpStatus.NOT_FOUND, "Images not found");
  }

  // Verify if the user exists
  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  // // Check if the user already has a cook profile
  const isAlreadyCookExist = await CookProfileModel.findOne({
    userId: isUserExist._id,
    isDeleted: false,
  });
  if (isAlreadyCookExist) {
    throw new AppError(
      HttpStatus.NOT_FOUND,
      "The User already has a cook profile",
    );
  }

  // Start a session for MongoDB transaction
  const session = await mongoose.startSession();

  try {
    session.startTransaction();
    // Upload the profile image to Cloudinary
    const profileImageUrl = await sendFileToCloudinary(
      profileImage[0]?.buffer,
      profileImage[0]?.originalname,
      profileImage[0]?.mimetype,
    );

    // Upload kitchen images to Cloudinary
    const kitchenImageUrls = [];
    // eslint-disable-next-line prefer-const
    for (let image of kitchenImages) {
      const result = await sendFileToCloudinary(
        image.buffer,
        image.originalname,
        image.mimetype,
      );
      kitchenImageUrls.push(result.secure_url);
    }

    // Upload kitchen images to Cloudinary
    const certificatesUrls = [];
    // eslint-disable-next-line prefer-const
    for (let cer of certificates) {
      const result = await sendFileToCloudinary(
        cer.buffer,
        cer.originalname,
        cer.mimetype,
      );
      certificatesUrls.push(result.secure_url);
    }

    const address = await getAddressFromCoordinates(
      Number(cook.lat),
      Number(cook.long),
    );
    const locationData: ILocation = {
      type: "Point",
      coordinates: [cook.long, cook.lat] as [number, number],
    };

    // Prepare the cook profile payload (excluding availability)
    const cookProfilePayload: ICookProfile = {
      ...cook,
      userId: isUserExist._id,
      cookName: isUserExist.name,
      businessNumber: isUserExist.klzhNumber as string,
      address: address,
      location: locationData,
      profileImage: profileImageUrl.secure_url,
      kitchenImages: kitchenImageUrls,
      certificates: certificatesUrls,
    };
    // Save the cook profile in the database with the session
    const savedCookProfile = await CookProfileModel.create(
      [cookProfilePayload],
      { session },
    );
    if (!savedCookProfile.length) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Cook create failed");
    }
    // Update the User's profile image in the database with the session
    const updateUser = await UserModel.findByIdAndUpdate(
      isUserExist?._id,
      {
        cookId: savedCookProfile[0]._id,
        profileImage: savedCookProfile[0].profileImage,
        isBecomeCook: true,
        $inc: { trackStep: 1 },
        lat: savedCookProfile[0].lat,
        long: savedCookProfile[0].long,
      },
      { new: true, session },
    );
    if (!updateUser) {
      throw new AppError(HttpStatus.BAD_REQUEST, "User update failed");
    }
    // Commit the transaction if all operations are successful
    await session.commitTransaction();
    session.endSession();
    return cookProfilePayload;
    // Return the saved cook profile
    // return { cook: savedCookProfile[0], user: updateUser };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // Abort the transaction if any operation fails
    await session.abortTransaction();
    session.endSession();
    throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, "Transaction failed");
  }
};

const setAvailability = async (
  cook: string,
  payload: {
    availability: ICookAvailability[];
  },
) => {
  const cookId = new Types.ObjectId(cook);
  const isCookExist = await CookProfileModel.findById(cookId);
  if (!isCookExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Cook not found");
  }
  const isCookHasAvailibility = await CookAvailabilityModel.findOne({
    cookId: isCookExist._id,
    $or: [
      { serviceType: "Delivery" },
      { serviceType: "Pick Up" },
      { serviceType: "Dine in" },
    ],
  });
  if (isCookHasAvailibility) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "This cook has already available time available in the app",
    );
  }
  try {
    // Iterate over each service type in the availability array
    // eslint-disable-next-line prefer-const
    for (let availabilityData of payload.availability) {
      // Extract serviceType and schedule
      const { serviceType, schedule } = availabilityData;

      // Validate serviceType (optional, ensure it’s one of the allowed values)
      if (!["Delivery", "Pick Up", "Dine in"].includes(serviceType)) {
        throw new Error(`Invalid serviceType: ${serviceType}`);
      }

      // Validate the schedule array (ensure it's not empty and contains valid data)
      if (!Array.isArray(schedule) || schedule.length === 0) {
        throw new Error(`Invalid schedule for serviceType: ${serviceType}`);
      }

      // Prepare the cook availability payload
      const cookAvailabilityPayload: ICookAvailability = {
        cookId: cookId,
        serviceType,
        schedule, // Assume schedule is already in the correct format (validated by previous steps)
      };

      // Save the availability data in the CookAvailability model
      await CookAvailabilityModel.create(cookAvailabilityPayload);
    }

    return { message: "Availability schedules added successfully" };
  } catch (error) {
    console.error("Error setting availability:", error);
    throw new Error("Error setting availability");
  }
};

const getCookProfile = async (user: JwtPayload) => {
  const userId = new Types.ObjectId(user.user);

  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  const cookProfile = await CookProfileModel.findOne({
    userId: userId,
    isDeleted: false,
  });
  if (!cookProfile) {
    throw new AppError(HttpStatus.NOT_FOUND, "Cook profile not found");
  }

  const cookAvailability = await CookAvailabilityModel.find({
    cookId: cookProfile._id,
  });

  if (!cookAvailability) {
    throw new AppError(HttpStatus.NOT_FOUND, "Cook availability not found");
  }

  return {
    data: cookProfile,
    availability: cookAvailability,
  };
};

// const cookSearch = ["cookName"];

const cooksLocation = async (
  query: Record<string, unknown>,
  // user: JwtPayload,
  payload: { lat: number; long: number },
) => {

  const userLong = Number(payload.long);
  const userLat = Number(payload.lat);

  // Extract query parameters
  const maxDistance = query.maxDistance ? Number(query.maxDistance) : 10000; // Default 5km
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;
  const searchTerm = query.searchTerm as string;

  // Build match stage for filters
  const matchStage: Record<string, unknown> = {
    isDeleted: false,
  };

  // Add filters from query
  if (query.isCookApproved !== undefined) {
    matchStage.isCookApproved = query.isCookApproved === "true";
  }

  if (query.isKlzhRegistered !== undefined) {
    matchStage.isKlzhRegistered = query.isKlzhRegistered === "true";
  }

  if (query.rating) {
    matchStage.rating = { $gte: Number(query.rating) };
  }

  // Build search conditions
  const searchConditions: Record<string, unknown>[] = [];

  if (searchTerm) {
    searchConditions.push(
      { cookName: { $regex: searchTerm, $options: "i" } },
      { description: { $regex: searchTerm, $options: "i" } },
      { shortDescription: { $regex: searchTerm, $options: "i" } },
      { address: { $regex: searchTerm, $options: "i" } },
    );
  }

  // Aggregation pipeline
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pipeline: any[] = [
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: [userLong, userLat],
        },
        distanceField: "distance", // Distance in meters
        maxDistance: maxDistance,
        spherical: true,
        query: matchStage, // Base filters applied in $geoNear
      },
    },
  ];

  // Add search stage if search term exists
  if (searchConditions.length > 0) {
    pipeline.push({
      $match: {
        $or: searchConditions,
      },
    });
  }

  // Add sorting (by distance, then rating)
  pipeline.push({
    $sort: { distance: 1, rating: -1 },
  });

  // Get total count before pagination
  const countPipeline = [...pipeline, { $count: "total" }];
  const countResult = await CookProfileModel.aggregate(countPipeline);
  const total = countResult.length > 0 ? countResult[0].total : 0;

  // Add pagination
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: limit });

  // Add population for userId if needed
  pipeline.push({
    $lookup: {
      from: "users", // Collection name (usually lowercase + plural)
      localField: "userId",
      foreignField: "_id",
      as: "userDetails",
    },
  });

  // Unwind userDetails (optional, if you want user as object not array)
  pipeline.push({
    $unwind: {
      path: "$userDetails",
      preserveNullAndEmptyArrays: true,
    },
  });

  // Project fields (optional - customize what you want to return)
  pipeline.push({
    $project: {
      cookName: 1,
      businessNumber: 1,
      description: 1,
      shortDescription: 1,
      address: 1,
      location: 1,
      profileImage: 1,
      kitchenImages: 1,
      certificates: 1,
      rating: 1,
      stars: 1,
      totalReviews: 1,
      totalOrders: 1,
      completedOrders: 1,
      isKlzhRegistered: 1,
      isCookApproved: 1,
      distance: 1, // Distance from user in meters
      distanceInKm: { $divide: ["$distance", 1000] }, // Convert to km
      "userDetails.name": 1,
      "userDetails.email": 1,
      "userDetails.phone": 1,
      createdAt: 1,
      updatedAt: 1,
    },
  });

  // Execute aggregation
  const result = await CookProfileModel.aggregate(pipeline);

  if (!result || result.length === 0) {
    throw new AppError(HttpStatus.NOT_FOUND, "No cooks found nearby");
  }

  console.log(`Found ${result.length} cooks near user location`);
  emitCookLocationUpdate(result);

  // Build meta object
  const meta = {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };

  return { meta: meta, result };
};

// const getCooksByRate = async (query: Record<string, unknown>) => {
//   const cookQuery = new QueryBuilder(CookProfileModel.find(), query).filter();

//   const meta = await cookQuery.countTotal();
//   const result = await cookQuery.modelQuery;

//   if (!result || result.length === 0) {
//     throw new AppError(HttpStatus.NOT_FOUND, "Cooks not found");
//   }

//   return { meta, result };
// };

const getEachCook = async (cookId: string) => {
  // 1. Find cook
  const cook = await CookProfileModel.findById(cookId);
  if (!cook) {
    throw new AppError(HttpStatus.NOT_FOUND, "Cook not found");
  }

  // 2. Find meals of this cook
  const meals = await MealModel.find({ cookId: cook._id })
    .sort({ createdAt: -1 })
    .limit(20);

  if (!meals.length) {
    console.log("meals are not available for now");
  }

  // 3. Attach cook rating to each meal
  const mealsWithRating = meals.map((meal) => ({
    ...meal.toObject(),
    rating: cook.rating,
  }));

  // 4. Reviews
  const reviews = await ReviewModel.find({
    cookId: cook._id,
    isDeleted: false,
  })
    .populate("userId", "name profileImage")
    .sort({ createdAt: -1 });

  return {
    cook,
    meals: mealsWithRating,
    reviews,
  };
};

export const cookServices = {
  becomeACook,
  setAvailability,
  getCookProfile,
  cooksLocation,
  getEachCook,
};
