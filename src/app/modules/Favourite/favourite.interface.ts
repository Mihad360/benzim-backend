import { Types } from "mongoose";

export interface IFavorite {
  userId: Types.ObjectId;
  cookId?: Types.ObjectId | null;
  mealId?: Types.ObjectId | null;
  type: "cook" | "meal";
  isFavourite: boolean;
  isDeleted: boolean;
}
