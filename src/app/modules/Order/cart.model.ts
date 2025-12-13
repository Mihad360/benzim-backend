import { model, Schema } from "mongoose";
import { ICart } from "./cart.interface";

const orderSchema = new Schema<ICart>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cookId: {
      type: Schema.Types.ObjectId,
      ref: "Cook",
      required: true,
    },
    mealId: {
      type: Schema.Types.ObjectId,
      ref: "Meal",
      required: true,
    },
    orderId: { type: String, required: true },
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["pending", "completed", "cancelled"],
      default: "pending",
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const CartModel = model<ICart>("Cart", orderSchema);
