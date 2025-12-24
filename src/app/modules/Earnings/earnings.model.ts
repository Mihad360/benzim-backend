import { Schema, model } from "mongoose";
import { IEarning } from "./earnings.interface";

const EarningSchema = new Schema<IEarning>(
  {
    orderId: {
      type: String,
      required: true,
      index: true,
    },

    saleAmount: {
      type: Number,
      required: true,
    },

    customerEndCommissionRate: {
      type: Number,
      required: true,
      default: 7.5,
    },

    customerEndCommissionAmount: {
      type: Number,
      required: true,
    },

    cookEndCommissionRate: {
      type: Number,
      required: true,
      default: 7.5,
    },

    cookEndCommissionAmount: {
      type: Number,
      required: true,
    },

    commissionAmount: {
      type: Number,
      required: true,
    },

    date: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  },
);

export const EarningModel = model<IEarning>("Earnings", EarningSchema);
