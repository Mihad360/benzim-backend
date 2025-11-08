import { Types } from "mongoose";

export interface IPayment {
  userId: Types.ObjectId;
  orderId: Types.ObjectId[];
  tip?: number; // optional
  totalAmount: number;
  paymentStatus?: "pending" | "completed" | "failed";
  isDeleted: boolean;
}

export interface IPaymentMetadata {
  userId: string; // must be string for Stripe metadata
//   orderId: string;
//   orderNo: string;
  totalAmount: number;
  tip?: number;
  email?: string;
}
