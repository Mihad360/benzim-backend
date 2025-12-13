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
    // 5️⃣ ADMIN FEE — 7%
    const adminFeePercent = 0.07;

    // Floating-point-safe calculation
    const rawAdminFeeAmount = totalAmount * adminFeePercent;
    const adminFeeAmount = roundToCent(rawAdminFeeAmount); // fixes floating issues
    const adminFeeInCents = Math.round(adminFeeAmount * 100);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
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
          destination: cookUser.stripeAccountId, // 👈 send to cook automatically
        },
        application_fee_amount: adminFeeInCents, // 👈 admin cut
      },

      success_url: "http://localhost:5173/stripe/success",
      cancel_url: "http://localhost:5000/stripe/cancel",
      metadata: {
        userId: userId.toString(),
        orderId: orderId.toString(),
        totalAmount: totalAmount.toString(),
        adminFeeAmount: adminFeeInCents,
      },
    });

    return session.url;
  } catch (error) {
    console.error("❌ Stripe payment creation error:", error);
    throw error;
  }
};
