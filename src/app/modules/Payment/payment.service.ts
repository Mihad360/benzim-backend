import HttpStatus from "http-status";
import mongoose, { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { IPayment, IPaymentMetadata } from "./payment.interface";
import { PaymentModel } from "./payment.model";
import AppError from "../../erros/AppError";
import { Payment } from "../../utils/STRIPE/stripePayment";

export const createPayment = async (
  user: JwtPayload,
  payload: IPayment | IPaymentMetadata,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = new Types.ObjectId(user.user);

    payload.userId = userId;

    // ✅ Prepare Stripe metadata (no tip calculation here)
    const metaData: IPaymentMetadata = {
      userId: userId.toString(),
      totalAmount: payload.totalAmount,
      tip: payload.tip || 0,
      orderIds: payload.orderIds,
      email: user.email as string,
    };

    console.log("🧾 Final metadata:", metaData);

    const paymentUrl = await Payment(metaData);

    // ✅ Commit transaction
    await session.commitTransaction();
    session.endSession();

    console.log("✅ Payment created:", paymentUrl);
    return paymentUrl;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ Transaction failed:", error);
    throw new AppError(HttpStatus.BAD_REQUEST, "Payment creation failed");
  }
};

export const payAmount = async (payload: IPaymentMetadata) => {
  console.log(payload.orderIds);
  const result = await PaymentModel.create(payload);
  //   console.log(result);
  return result;
};

export const paymentServices = {
  createPayment,
};
