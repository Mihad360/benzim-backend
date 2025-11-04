import HttpStatus from "http-status";
import { Types } from "mongoose";
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
  "availablePortion",
  "dietaryCategories",
  "category",
  "fitnessFlow",
  "cheatFlow",
  "timeForOrder",
  "timeForPickUpFood",
  "servedWarm",
  "ingredients",
  "allergyInformation",
  "pricePerPortion",
  "price",
  "location",
  "pickUpTime",
  "offer",
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
  if (isCookExist.isCookApproved === false) {
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

  if (isUserExist.role === "cook") {
    const isCookExist = await CookProfileModel.findOne({
      userId: isUserExist._id,
    });
    if (!isCookExist) {
      throw new AppError(HttpStatus.NOT_FOUND, "Cook not found");
    }

    // Cook → only their meals
    mealQuery = MealModel.find({ cookId: isCookExist._id });
  } else if (isUserExist.role === "user") {
    // User → all meals
    mealQuery = MealModel.find();
  } else {
    throw new AppError(HttpStatus.FORBIDDEN, "Invalid user role");
  }

  const meals = new QueryBuilder(mealQuery, query)
    .search(MEAL_SEARCHABLE_FIELDS)
    .filter()
    .fields()
    .paginate()
    .sort();

  const meta = await meals.countTotal();
  const result = await meals.modelQuery;

  if (!result || result.length === 0) {
    throw new AppError(HttpStatus.NOT_FOUND, "Meals not found");
  }

  return { meta, result };
};

export const mealServices = {
  addMeal,
  getMyMeals,
};
