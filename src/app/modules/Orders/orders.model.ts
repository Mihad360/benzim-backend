import { Schema, model } from "mongoose";
import { IOrders } from "./orders.interface";

const PaymentSchema = new Schema<IOrders>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cartIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Meal",
      },
    ],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    tip: {
      type: Number,
      default: 0,
      min: 0,
    },
    orderNo: {
      type: String,
    },
    status: {
      type: String,
      enum: [
        "new",
        "in_preparation",
        "ready_for_pickup",
        "completed",
        "cancelled",
      ],
      default: "new",
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        changedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true, // adds createdAt & updatedAt
  },
);

export const OrderModel = model<IOrders>("Order", PaymentSchema);
