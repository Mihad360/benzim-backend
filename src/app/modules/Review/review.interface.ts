import { Types } from "mongoose";

export interface IReview {
  userId: Types.ObjectId;
  cookId: Types.ObjectId;
  mealId: Types.ObjectId;
  rating: number;
  comment: string;
  isDeleted: boolean;
}
