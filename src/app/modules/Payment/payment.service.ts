import HttpStatus from "http-status";
import mongoose, { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { IPayment, IPaymentMetadata } from "./payment.interface";
import { PaymentModel } from "./payment.model";
import AppError from "../../erros/AppError";
import { Payment } from "../../utils/STRIPE/stripePayment";
import { OrderModel } from "../Orders/orders.model";
import { roundToCent } from "../Orders/orders.service";

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
    const order = await OrderModel.findById(payload.orderId);
    if (!order) {
      throw new AppError(HttpStatus.NOT_FOUND, "Order not found");
    }
    const stripeFee = roundToCent(
      order.totalAmount * (Number(order.stripeFeePercentage) / 100) +
        Number(order.stripeFixedFee),
    );

    const finalAmount = roundToCent(order.totalAmount + stripeFee);

    console.log("💰 Base Amount:", order.totalAmount);
    console.log("💸 Stripe Fee:", stripeFee);
    console.log("💳 Final Amount Charged:", finalAmount);

    // 3️⃣ Prepare metadata
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const metaData: IPaymentMetadata | any = {
      userId: userId.toString(),
      orderId: payload.orderId,
      email: user.email,
      baseAmount: order.totalAmount,
      stripeFee: stripeFee,
      totalAmount: finalAmount,
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
        created_At: new Date(),
      },
      { new: true },
    );
  }
  return result;
};

export const paymentServices = {
  createPayment,
};





// stripe publish = 
// stripe secret = 
// webhook payment = 
// webhook account = 