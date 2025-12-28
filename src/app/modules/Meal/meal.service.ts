/* eslint-disable @typescript-eslint/no-explicit-any */
import HttpStatus from "http-status";
import { PipelineStage, Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { IMeal } from "./meal.interface";
import { UserModel } from "../User/user.model";
import AppError from "../../erros/AppError";
import { CookProfileModel } from "../Cook/cook.model";
import { MealModel } from "./meal.model";
import { sendFileToCloudinary } from "../../utils/sendImageToCloudinary";
import QueryBuilder from "../../builder/QueryBuilder";

export const MEAL_SEARCHABLE_FIELDS = [
  "mealName",
  "description",
  "dietaryCategories",
  "category",
  "fitnessFlow",
  "cheatFlow",
  "timeForOrder",
  "timeForPickUpFood",
  "servedWarm",
  "ingredients",
  "allergyInformation",
  "location",
];

const addMeal = async (
  payload: IMeal,
  user: JwtPayload,
  files: Express.Multer.File[],
) => {
  const userId = new Types.ObjectId(user.user);
  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  const isCookExist = await CookProfileModel.findOne({
    userId: isUserExist._id,
  });

  if (!isCookExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Cook not found");
  }

  // ⛔ Check cook approval and limit
  if (isUserExist.isCookfullyVerified === false) {
    const mealCount = await MealModel.countDocuments({
      cookId: isCookExist._id,
    });

    if (mealCount >= 3) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "You cannot add more than 3 meals until your profile is approved",
      );
    }
  }

  // ✅ Handle file uploads if files exist
  const imageUrls: string[] = [];
  if (files && files.length > 0) {
    for (const file of files) {
      try {
        const uploadResult = await sendFileToCloudinary(
          file.buffer,
          file.originalname,
          file.mimetype,
        );
        if (uploadResult?.secure_url) {
          imageUrls.push(uploadResult.secure_url);
        }
      } catch (error) {
        console.error("Cloudinary upload error:", error);
        throw new AppError(
          HttpStatus.INTERNAL_SERVER_ERROR,
          "Error uploading image to Cloudinary",
        );
      }
    }
  }

  payload.imageUrls = imageUrls;
  payload.cookId = isCookExist._id;

  const newMeal = await MealModel.create(payload);
  return newMeal;
};

const getMyMeals = async (user: JwtPayload, query: Record<string, unknown>) => {
  const userId = new Types.ObjectId(user.user);
  const isUserExist = await UserModel.findById(userId);

  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  let mealQuery;

  // ============================
  // 1️⃣ FETCH MEALS: ORIGINAL LOGIC
  // ============================
  if (isUserExist.role === "cook") {
    const isCookExist = await CookProfileModel.findOne({
      userId: isUserExist._id,
    });
    if (!isCookExist) {
      throw new AppError(HttpStatus.NOT_FOUND, "Cook not found");
    }
    mealQuery = MealModel.find({ cookId: isCookExist._id }).populate({
      path: "cookId",
      select: "rating cookName profileImage",
    });
  } else if (isUserExist.role === "user") {
    mealQuery = MealModel.find().populate({
      path: "cookId",
      select: "rating cookName profileImage",
    });
  } else {
    throw new AppError(HttpStatus.FORBIDDEN, "Invalid user role");
  }

  const { only, ...queryWithoutOnly } = query;

  const mealsBuilder = new QueryBuilder(mealQuery, queryWithoutOnly)
    .search(MEAL_SEARCHABLE_FIELDS)
    .filter()
    .fields()
    .paginate()
    .sort();

  const meta = await mealsBuilder.countTotal();
  const meals = await mealsBuilder.modelQuery;

  // ============================
  // 2️⃣ GET TOP RATED COOKS
  // ============================
  const topRatedCooks = await CookProfileModel.find()
    .sort({ rating: -1 })
    .limit(10) // you can adjust if needed
    .select("cookName rating profileImage businessNumber");

  // ============================
  // 3️⃣ GET POPULAR MEALS (Rating-based)
  // ============================
  const popularMeals = await MealModel.aggregate([
    {
      $lookup: {
        from: "cooks",
        localField: "cookId",
        foreignField: "_id",
        as: "cook",
      },
    },
    { $unwind: "$cook" },

    // Sort by converted rating
    { $sort: { "cook.rating": -1 } },

    { $limit: 10 },

    // Return full meal + selected cook fields
    {
      $project: {
        _id: 1,
        mealName: 1,
        description: 1,
        price: 1,
        availablePortion: 1,
        kcalories: 1,
        imageUrls: 1,
        mealType: 1,
        cookId: 1,
        cook: {
          _id: 1,
          cookName: 1,
          rating: 1,
          profileImage: 1,
        },
      },
    },
  ]);

  // ============================
  // Final Return (CONDITIONAL)
  // ============================

  // const only = query.only as string | undefined;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response: any = { meta, meals };

  if (!only || only !== "meals") {
    response.topRatedCooks = topRatedCooks;
    response.popularMeals = popularMeals;
  }

  return response;

  // ============================
  // Final Return
  // ============================
  // return {
  //   meta,
  //   meals,
  //   topRatedCooks,
  //   popularMeals,
  // };
};

const topRatedCooks = async (query: Record<string, unknown>) => {
  const cooks = new QueryBuilder(
    CookProfileModel.find().select(
      "cookName rating profileImage businessNumber location",
    ),
    query,
  )
    .filter()
    .fields()
    .paginate()
    .sort();

  const meta = await cooks.countTotal();
  const result = await cooks.modelQuery;
  return { meta, result };
};

const popularMeals = async (query: Record<string, unknown>) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const match: Record<string, unknown> = {};

  if (query.mealType) {
    match.mealType = query.mealType;
  }

  const matchStage: PipelineStage.Match = {
    $match: match,
  };

  const pipeline: PipelineStage[] = [
    {
      $lookup: {
        from: "cooks",
        localField: "cookId",
        foreignField: "_id",
        as: "cook",
      },
    },
    { $unwind: "$cook" },

    // 🔍 filtering
    matchStage,

    // ⭐ sort by cook rating
    { $sort: { "cook.rating": -1 } },

    // 📄 pagination
    { $skip: skip },
    { $limit: limit },

    // 🎯 projection
    {
      $project: {
        mealName: 1,
        price: 1,
        imageUrls: 1,
        mealType: 1,
        cook: {
          cookName: 1,
          rating: 1,
          profileImage: 1,
        },
      },
    },
  ];

  const result = await MealModel.aggregate(pipeline);

  // 🔢 total count (for pagination UI)
  const total = await MealModel.aggregate([
    {
      $lookup: {
        from: "cooks",
        localField: "cookId",
        foreignField: "_id",
        as: "cook",
      },
    },
    { $unwind: "$cook" },
    matchStage,
    { $count: "total" },
  ]);

  const totalItems = total[0]?.total || 0;
  const totalPages = Math.ceil(totalItems / limit);

  return {
    meta: {
      page,
      limit,
      totalItems,
      totalPages,
    },
    result,
  };
};

const getEachMeal = async (mealId: string) => {
  const meal = await MealModel.findById(mealId).lean();

  if (!meal) {
    throw new AppError(HttpStatus.NOT_FOUND, "Meal not found");
  }

  const cook = await CookProfileModel.findById(meal.cookId)
    .select("rating")
    .lean();

  return {
    ...meal,
    rating: cook?.rating ?? null,
  };
};

export const mealServices = {
  addMeal,
  getMyMeals,
  topRatedCooks,
  popularMeals,
  getEachMeal,
};
