import { stripe } from "./stripe.config";
import { IPaymentMetadata } from "../../modules/Payment/payment.interface";

export const Payment = async (metadata: IPaymentMetadata) => {
  try {
    const { tip, email, totalAmount } = metadata;

    // ✅ Prepare metadata for Stripe (all values must be strings)
    const stripeMetadata: Record<string, string> = {
      userId: metadata.userId,
      // orderId: metadata.orderId,
      // orderNo: metadata.orderNo,
      totalAmount: totalAmount.toString(),
      tip: tip ? tip.toString() : "0",
    };

    // ✅ Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"], // optional
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: totalAmount * 100, // cents
            product_data: {
              name: `Payment for order #`,
            },
          },
          quantity: 1,
        },
      ],
      customer_email: email,
      success_url: `http://localhost:5000/stripe/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `http://localhost:5000/stripe/cancel`,
      metadata: stripeMetadata, // ✅ string-safe metadata
    });

    return session.url;
  } catch (error) {
    console.error("❌ Stripe payment creation error:", error);
    throw error;
  }
};
