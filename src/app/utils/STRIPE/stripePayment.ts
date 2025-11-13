import HttpStatus from "http-status";
import { stripe } from "./stripe.config";
import { IPaymentMetadata } from "../../modules/Payment/payment.interface";
import { OrderModel } from "../../modules/Orders/orders.model";
import AppError from "../../erros/AppError";

export const Payment = async (metadata: IPaymentMetadata) => {
  try {
    const { email, userId, orderId } = metadata;

    const order = await OrderModel.findById(orderId);
    if (!order) {
      throw new AppError(HttpStatus.NOT_FOUND, "Order not found");
    }

    const totalAmount = order.totalAmount; // assuming totalAmount is stored on order directly
    if (!totalAmount || totalAmount <= 0) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Invalid total amount");
    }

    console.log("Order No:", order.orderNo);

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
      success_url: "http://localhost:5173/stripe/success",
      cancel_url: "http://localhost:5000/stripe/cancel",
      metadata: {
        userId: userId.toString(),
        orderId: orderId.toString(),
        totalAmount: totalAmount.toString(),
      },
    });

    return session.url;
  } catch (error) {
    console.error("❌ Stripe payment creation error:", error);
    throw error;
  }
};
