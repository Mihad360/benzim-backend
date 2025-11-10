import { Types } from "mongoose";

export interface ICart {
  _id?: Types.ObjectId;
  userId: Types.ObjectId;
  cookId: Types.ObjectId;
  mealId: Types.ObjectId;
  orderId: string;
  quantity: number;
  totalPrice: number;
  status?: "pending" | "completed" | "cancelled";
  isDeleted: boolean;
}
