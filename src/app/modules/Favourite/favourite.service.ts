import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { IFavorite } from "./favourite.interface";
import { FavoriteModel } from "./favourite.model";
import { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { UserModel } from "../User/user.model";
import QueryBuilder from "../../builder/QueryBuilder";

const addToFavourite = async (
  user: JwtPayload,
  payload: { type: "cook" | "meal"; id: string }, // this will be either cookId or mealId based on type
) => {
  const userId = new Types.ObjectId(user.user);
  if (!["cook", "meal"].includes(payload.type)) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Invalid favourite type");
  }

  const favoriteData: Partial<IFavorite> = {
    userId,
    type: payload.type,
  };
  const favouriteId = new Types.ObjectId(payload.id);
  // Assign id based on type
  if (payload.type === "cook") {
    favoriteData.cookId = favouriteId;
  } else if (payload.type === "meal") {
    favoriteData.mealId = favouriteId;
  }

  // Check duplicate favourite
  const isAlreadyFavourite = await FavoriteModel.findOne({
    userId,
    ...(payload.type === "cook"
      ? { cookId: favouriteId }
      : { mealId: favouriteId }),
  });

  if (isAlreadyFavourite) {
    throw new AppError(
      HttpStatus.CONFLICT,
      `${payload.type} is already added to favourites`,
    );
  }

  // Create favourite
  const newFavourite = await FavoriteModel.create(favoriteData);
  if (!newFavourite) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Failed!");
  }
  return newFavourite;
};

const getMyFavourites = async (
  user: JwtPayload,
  query: Record<string, unknown>,
) => {
  const userId = new Types.ObjectId(user.user);
  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }
  const favouriteQuery = new QueryBuilder(
    FavoriteModel.find({ userId }),
    query,
  ).filter();

  let mongooseQuery = favouriteQuery.modelQuery;
  if (query.type === "meal") {
    mongooseQuery = mongooseQuery.populate("mealId");
  } else if (query.type === "cook") {
    mongooseQuery = mongooseQuery.populate("cookId");
  } else {
    mongooseQuery = mongooseQuery.populate("mealId").populate("cookId");
  }
  const meta = await favouriteQuery.countTotal();
  const favorites = await mongooseQuery;
  return { meta, favorites };
};

const deleteFavorite = async (user: JwtPayload, favoriteId: string) => {
  const userId = new Types.ObjectId(user.user);
  const favoId = new Types.ObjectId(favoriteId);
  const isFavouriteExist = await FavoriteModel.findById(favoId);
  if (!isFavouriteExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "This data is not available");
  }
  const result = await FavoriteModel.findOneAndDelete({
    userId: userId,
    _id: isFavouriteExist._id,
  });
  if (result) {
    return { message: "Removed from favorites" };
  } else {
    throw new AppError(HttpStatus.BAD_REQUEST, "Something went wrong!");
  }
};

export const favouriteServices = {
  addToFavourite,
  getMyFavourites,
  deleteFavorite,
};
