import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { JwtPayload } from "../../interface/global";
import { CookProfileModel } from "../Cook/cook.model";
import { ICategory } from "./category.interface";
import { CategoryModel } from "./category.model";

const addCategory = async (payload: ICategory, user: JwtPayload) => {
  const isCookExist = await CookProfileModel.findOne({ userId: user.user });
  if (!isCookExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Cook not found");
  }

  const category = await CategoryModel.create(payload);

  return category;
};

export const categoryServices = {
  addCategory,
};
