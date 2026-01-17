import { Types } from "mongoose";

export interface IEarning {
  orderId: Types.ObjectId;
  orderNo: string;
  cookId: Types.ObjectId;
  // What customer paid
  totalPaidByCustomer: number;

  // What cook receives (after admin cut)
  cookEarnings: number;
  cookEarningsRate: number; // e.g., 0.93 (93%)

  // What admin earns (platform fee)
  adminEarn: number;
  adminEarnRate: number; // e.g., 0.07 (7%)

  date: string;
  status: "pending" | "completed" | "failed";
  isDeleted: boolean;
}
