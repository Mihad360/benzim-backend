import HttpStatus from "http-status";
import { stripe } from "./stripe.config";
import { IPaymentMetadata } from "../../modules/Payment/payment.interface";
import { OrderModel } from "../../modules/Orders/orders.model";
import AppError from "../../erros/AppError";
import { CookProfileModel } from "../../modules/Cook/cook.model";
import { UserModel } from "../../modules/User/user.model";
import { roundToCent } from "../../modules/Orders/orders.service";

export const Payment = async (metadata: IPaymentMetadata) => {
  try {
    const { email, userId, orderId } = metadata;

    const order = await OrderModel.findById(orderId);
    if (!order) {
      throw new AppError(HttpStatus.NOT_FOUND, "Order not found");
    }
    const cookData = await CookProfileModel.findById(order.cookId);
    if (!cookData) {
      throw new AppError(HttpStatus.NOT_FOUND, "Cook not found");
    }
    const cookUser = await UserModel.findById(cookData.userId).select(
      "stripeAccountId",
    );
    if (!cookUser) {
      throw new AppError(HttpStatus.NOT_FOUND, "Cook User not found");
    }

    const totalAmount = metadata.totalAmount;
    if (!totalAmount || totalAmount <= 0) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Invalid total amount");
    }

    // 💰 FINANCIAL BREAKDOWN
    const adminEarnRate = 0.07; // 7% admin commission

    // Calculate admin earnings
    const adminEarn = roundToCent(totalAmount * adminEarnRate);
    const adminEarnInCents = Math.round(adminEarn * 100);

    // Calculate cook earnings (what remains after admin cut)
    const cookEarnings = roundToCent(totalAmount - adminEarn);
    const cookEarningsRate = roundToCent(cookEarnings / totalAmount);

    // Calculate percentage representations (for display/metadata)
    const cookEarningsPercentage = roundToCent(cookEarningsRate * 100);
    const adminEarnPercentage = roundToCent(adminEarnRate * 100);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "chf",
            unit_amount: Math.round(totalAmount * 100), // Stripe expects cents
            product_data: {
              name: `Order #${order.orderNo}`,
            },
          },
          quantity: 1,
        },
      ],
      customer_email: email,

      payment_intent_data: {
        transfer_data: {
          destination: cookUser.stripeAccountId, // Transfer to cook
        },
        application_fee_amount: adminEarnInCents, // Admin's cut
      },

      success_url: "https://success-murex.vercel.app",
      cancel_url: "https://failed-dun.vercel.app",

      metadata: {
        // User & Order Info
        userId: userId.toString(),
        orderId: orderId.toString(),
        cookId: order.cookId.toString(),
        orderNo: order.orderNo.toString(),
        totalAmount: totalAmount.toString(),
        // Financial Breakdown (all in CHF decimal format)
        totalPaidByCustomer: totalAmount.toString(),

        cookEarnings: cookEarnings.toString(),
        cookEarningsRate: cookEarningsRate.toString(),
        cookEarningsPercentage: cookEarningsPercentage.toString(),

        adminEarn: adminEarn.toString(),
        adminEarnRate: adminEarnRate.toString(),
        adminEarnPercentage: adminEarnPercentage.toString(),
      },
    });
    return session.url;
  } catch (error) {
    console.error("❌ Stripe payment creation error:", error);
    throw error;
  }
};
