import { Schema, model } from "mongoose";
import { IOrders } from "./orders.interface";

const PaymentSchema = new Schema<IOrders>(
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
    cartIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Cart",
      },
    ],
    conversationId: {
      type: Schema.Types.ObjectId,
      ref: "Conversaton",
      required: true,
    },
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
    discountedAmount: {
      type: Number,
      default: 0,
    },
    orderNo: {
      type: String,
    },
    promoCode: {
      type: String,
    },
    maxCompleted: {
      type: Number,
    },

    // NEW STRIPE FEE FIELDS
    stripeFeePercentage: {
      type: Number,
      default: 2.9, // Switzerland default %
    },
    stripeFixedFee: {
      type: Number,
      default: 0.3, // Switzerland fixed CHF
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
    timestamps: true,
  },
);

export const OrderModel = model<IOrders>("Order", PaymentSchema);
