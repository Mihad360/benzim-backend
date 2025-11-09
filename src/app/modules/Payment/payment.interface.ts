import { Types } from "mongoose";

export interface IPayment {
  userId: Types.ObjectId;
  orderIds: string[] | Types.ObjectId[] | undefined;
  tip?: number | string; // optional
  totalAmount: number;
  paymentStatus?: "pending" | "completed" | "failed";
  isDeleted: boolean;
}

export interface IPaymentMetadata {
  userId: string; // must be string for Stripe metadata
  orderIds?: string[] | Types.ObjectId[] | undefined;
  //   orderNo: string;
  totalAmount: number;
  tip?: number | string;
  email?: string;
}
