import { Schema, model } from "mongoose";
import { IEarning } from "./earnings.interface";

const earningSchema = new Schema<IEarning>(
  {
    orderId: {
      type: String,
      required: true,
    },
    orderNo: {
      type: String,
      required: true,
    },

    totalPaidByCustomer: {
      type: Number,
      required: true,
    },

    cookEarnings: {
      type: Number,
      required: true,
    },

    cookEarningsRate: {
      type: Number,
      required: true,
    },

    adminEarn: {
      type: Number,
      required: true,
    },

    adminEarnRate: {
      type: Number,
      required: true,
    },

    date: {
      type: String,
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
