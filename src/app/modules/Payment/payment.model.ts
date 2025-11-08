import { Schema, model } from "mongoose";
import { IPayment } from "./payment.interface";

const PaymentSchema = new Schema<IPayment>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
  },
  orderId: {
    type: [Schema.Types.ObjectId],
    ref: "Order",
  },
  tip: {
    type: Number,
    default: 0, // optional field
  },
  totalAmount: {
    type: Number,
    required: true,
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed"],
    default: "pending",
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
});

export const PaymentModel = model<IPayment>("Payment", PaymentSchema);
