import { Schema, model } from "mongoose";
import { IEarning } from "./earnings.interface";

const earningSchema = new Schema<IEarning>(
  {
    orderId: {
      type: String,
      required: true,
      index: true,
    },

    totalPaidByCustomer: {
      type: Number,
      required: true,
      min: 0,
    },

    cookEarnings: {
      type: Number,
      required: true,
      min: 0,
    },

    cookEarningsRate: {
      type: Number,
      required: true,
      min: 0,
      max: 1,
    },

    adminEarn: {
      type: Number,
      required: true,
      min: 0,
    },

    adminEarnRate: {
      type: Number,
      required: true,
    },

    date: {
      type: Date,
      default: Date.now,
    },

    status: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

export const EarningModel = model<IEarning>("Earning", earningSchema);
