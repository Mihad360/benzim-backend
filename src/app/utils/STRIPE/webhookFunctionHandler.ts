import HttpStatus from "http-status";
import Stripe from "stripe";
import { PaymentModel } from "../../modules/Payment/payment.model";
import { EarningModel } from "../../modules/Earnings/earnings.model";
import AppError from "../../erros/AppError";

export const handleCheckoutSessionCompleted = async (
  session: Stripe.Checkout.Session,
) => {
  const { metadata } = session;

  if (!metadata) {
    throw new AppError(HttpStatus.NOT_FOUND, "Metadata not found");
  }

  // 1️⃣ Create payment first
  const paymentPayload = {
    userId: metadata.userId,
    orderId: metadata.orderId,
    totalAmount: Number(metadata.totalAmount),
    paymentStatus: "completed",
    created_At: new Date(),
  };

  const payment = await PaymentModel.create(paymentPayload);

  if (!payment) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Payment data save failed");
  }

  // 2️⃣ Create earning payload from metadata
  const earningPayload = {
    orderId: metadata.orderId,

    totalPaidByCustomer: Number(metadata.totalPaidByCustomer),

    cookEarnings: Number(metadata.cookEarnings),
    cookEarningsRate: Number(metadata.cookEarningsRate),

    adminEarn: Number(metadata.adminEarn),
    adminEarnRate: Number(metadata.adminEarnRate),

    date: new Date(),
    status: payment.paymentStatus === "completed" ? "completed" : "failed",
  };

  // 3️⃣ Save earnings
  const earning = await EarningModel.create(earningPayload);
  if (!earning) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Earning save failed");
  }

  return {
    payment,
    earning,
  };
};
