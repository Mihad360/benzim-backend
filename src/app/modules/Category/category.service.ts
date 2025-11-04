import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { JwtPayload } from "../../interface/global";
import { CookProfileModel } from "../Cook/cook.model";
import { ICategory } from "./category.interface";
import { CategoryModel } from "./category.model";
import { Types } from "mongoose";
import { UserModel } from "../User/user.model";
import QueryBuilder from "../../builder/QueryBuilder";

const addCategory = async (payload: ICategory, user: JwtPayload) => {
  const isCookExist = await CookProfileModel.findOne({ userId: user.user });
  if (!isCookExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Cook not found");
  }

  const categoryName = payload.name.trim().toLowerCase();
  const isDuplicate = await CategoryModel.findOne({
    name: { $regex: new RegExp(`^${categoryName}$`, "i") },
    type: payload.type,
    cookId: payload.cookId,
  });

  if (isDuplicate) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Category with this name already exists",
    );
  }

  const category = await CategoryModel.create(payload);
  return category;
};

const getCategories = async (
  user: JwtPayload,
  query: Record<string, unknown>,
) => {
  const userId = new Types.ObjectId(user.user);
  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }
  const categories = new QueryBuilder(
    CategoryModel.find({ isDeleted: false }).select("name type"),
    query,
  ).filter();

  if (!categories) {
    throw new AppError(HttpStatus.NOT_FOUND, "session not found");
  }
  const meta = await categories.countTotal();
  const result = await categories.modelQuery;
  return { meta, result };
};

export const categoryServices = {
  addCategory,
  getCategories,
};
