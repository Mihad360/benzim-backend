import HttpStatus from "http-status";
import mongoose, { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { IPayment, IPaymentMetadata } from "./payment.interface";
import { PaymentModel } from "./payment.model";
import { OrderModel } from "../Order/order.model";
import AppError from "../../erros/AppError";
import { Payment } from "../../utils/STRIPE/stripePayment";

export const createPayment = async (user: JwtPayload, payload: IPayment) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = new Types.ObjectId(user.user);
    const tipAmount = payload.tip || 0;
    const total = payload.totalAmount;
    payload.userId = userId;

    // ✅ Prepare Stripe metadata (all strings)
    const metaData: IPaymentMetadata = {
      userId: userId.toString(),
      totalAmount: total,
      tip: tipAmount,
      email: user.email as string,
    };

    // ✅ 1️⃣ Create pending payment record
    payload.paymentStatus = "pending";

    // const paymentDoc = await PaymentModel.create(
    //   [
    //     {
    //       ...payload,
    //       totalAmount: total,
    //     },
    //   ],
    //   { session },
    // );
    // if (!paymentDoc[0]) {
    //   throw new AppError(HttpStatus.BAD_REQUEST, "Payment failed");
    // }

    // ✅ 2️⃣ Create Stripe payment session
    const paymentUrl = await Payment(metaData);

    // ✅ 3️⃣ Commit the transaction
    await session.commitTransaction();
    session.endSession();

    console.log("✅ Payment created:", paymentUrl);
    return paymentUrl;
  } catch (error) {
    // ❌ Rollback on failure
    await session.abortTransaction();
    session.endSession();
    console.error("❌ Transaction failed:", error);
    throw new AppError(HttpStatus.BAD_REQUEST, "Payment creation failed");
  }
};

export const payAmount = async (payload: IPaymentMetadata) => {
  const result = await PaymentModel.create(payload);
  console.log(result);
  return result;
};

export const paymentServices = {
  createPayment,
};
