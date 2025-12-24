import { Types } from "mongoose";
import { IMeal } from "../Meal/meal.interface";

export interface IOrders {
  userId: Types.ObjectId;
  cookId: Types.ObjectId;
  cartIds: Types.ObjectId[]; // references Meal documents
  conversationId?: Types.ObjectId;
  totalAmount: number;
  tip?: number;
  discountedAmount: number;
  orderNo: string;
  stripeFeePercentage: number;
  stripeFixedFee: number;
  status:
    | "new"
    | "in_preparation"
    | "ready_for_pickup"
    | "completed"
    | "cancelled";
  statusHistory?: {
    status: string;
    changedAt: Date;
  }[];
  promoCode: string;
  maxCompleted: number;
  pickUpDate: Date; // "Today" | "Tomorrow" or actual date
  pickUpTime: string; // e.g. "4PM–5PM"
  specialInstructions?: string; // optional note from user
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ExtendOrderMealId extends Omit<IOrders, "cartIds"> {
  cartIds: (
    | Types.ObjectId
    | {
        mealId: IMeal | Types.ObjectId;
      }
  )[];
}
