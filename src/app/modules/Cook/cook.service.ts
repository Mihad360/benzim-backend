import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { JwtPayload } from "../../interface/global";
import { IFileFields } from "./cook.controller";
import { ICookAvailability, ICookProfile } from "./cook.interface";
import { sendFileToCloudinary } from "../../utils/sendImageToCloudinary";
import mongoose, { Types } from "mongoose";
import { UserModel } from "../User/user.model";
import { CookAvailabilityModel, CookProfileModel } from "./cook.model";
import QueryBuilder from "../../builder/QueryBuilder";
import { emitCookLocationUpdate } from "../../utils/socket";

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

  // Check if the user already has a cook profile
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

    // Prepare the cook profile payload (excluding availability)
    const cookProfilePayload: ICookProfile = {
      ...cook,
      userId: isUserExist._id,
      cookName: isUserExist.name,
      businessNumber: isUserExist.klzhNumber as string,
      profileImage: profileImageUrl.secure_url,
      kitchenImages: kitchenImageUrls,
      certificates: certificatesUrls,
    };

    // Save the cook profile in the database with the session
    const savedCookProfile = await CookProfileModel.create(
      [cookProfilePayload],
      { session },
    );

    // Update the User's profile image in the database with the session
    await UserModel.findByIdAndUpdate(
      isUserExist._id,
      {
        cookId: savedCookProfile[0]._id,
        profileImage: savedCookProfile[0].profileImage,
      },
      { new: true, session },
    );

    // Commit the transaction if all operations are successful
    await session.commitTransaction();
    session.endSession();

    // Return the saved cook profile
    return savedCookProfile[0];
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

const cooksLocation = async (
  payload: { cookIds: string[] },
  query: Record<string, unknown>,
) => {
  const cookQuery = new QueryBuilder(
    CookProfileModel.find({ _id: { $in: payload.cookIds } }),
    query,
  ).filter();

  const meta = await cookQuery.countTotal();
  const result = await cookQuery.modelQuery;

  if (!result || result.length === 0) {
    throw new AppError(HttpStatus.NOT_FOUND, "Cooks not found");
  }

  // 🔥 Emit socket event for each cook’s userId
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  result.forEach((cook: any) => {
    // console.log(cook);
    if (cook) {
      emitCookLocationUpdate(cook);
    }
  });

  return { meta, result };
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

export const cookServices = {
  becomeACook,
  setAvailability,
  getCookProfile,
  cooksLocation,
};
