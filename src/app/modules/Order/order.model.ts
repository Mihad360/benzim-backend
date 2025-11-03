import { model, Schema } from "mongoose";
import { IOrder } from "./order.interface";

const orderSchema = new Schema<IOrder>(
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
    orderId: { type: String },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    totalPrice: {
      type: Number,
      required: true,
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

    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },

    paymentMethod: {
      type: String,
      enum: ["cash", "online"],
      default: "online",
    },

    pickUpDate: {
      type: Date,
    },
    pickUpTime: {
      type: String,
      default: "",
    },

    specialInstructions: {
      type: String,
      default: "",
    },
    orderNotes: {
      type: String,
      default: "",
    },

    statusHistory: [
      {
        status: { type: String },
        changedAt: { type: Date, default: Date.now },
      },
    ],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const OrderModel = model<IOrder>("Order", orderSchema);
