import { Types } from "mongoose";

export interface IPayment {
  userId: Types.ObjectId;
  orderId: string | Types.ObjectId; // single orderId
  totalAmount: number;
  paymentStatus?: "pending" | "completed" | "failed";
  created_At: Date;
  isDeleted: boolean;
}

export interface IPaymentMetadata {
  userId: string; // must be string for Stripe metadata
  orderId: string | Types.ObjectId;
  totalAmount: number;
  email?: string;
}
