import HttpStatus from "http-status";
import mongoose, { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { IPayment, IPaymentMetadata } from "./payment.interface";
import { PaymentModel } from "./payment.model";
import AppError from "../../erros/AppError";
import { Payment } from "../../utils/STRIPE/stripePayment";
import { ICard } from "../Card/card.interface";

export const createPayment = async (
  user: JwtPayload,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: IPayment | IPaymentMetadata | any,
  //   card: ICard,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = new Types.ObjectId(user.user);

    payload.userId = userId;

    // ✅ Prepare Stripe metadata (no tip calculation here)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metaData: IPaymentMetadata | any = {
      userId: userId.toString(),
      totalAmount: payload.totalAmount,
      orderId: payload.orderId, // single orderId
      email: user.email as string,
    //   cardNumber: "4242424242424242",
    //   name: payload.name,
    //   brand: payload.brand,
    //   cvc: payload.cvc,
    //   exp_month: payload.exp_month,
    //   exp_year: payload.exp_year,
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
  const result = await PaymentModel.create(payload);
  if (result) {
    await PaymentModel.findByIdAndUpdate(
      result._id,
      {
        paymentStatus: "completed",
      },
      { new: true },
    );
  }
  return result;
};

export const paymentServices = {
  createPayment,
};
