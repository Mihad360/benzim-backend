import { stripe } from "./stripe.config";
import { IPaymentMetadata } from "../../modules/Payment/payment.interface";

export const Payment = async (metadata: IPaymentMetadata) => {
  try {
    const { tip, email, totalAmount, userId, orderIds } = metadata;

    // ✅ Stripe metadata must be string | number | null only
    const stripeMetadata: Record<string, string> = {
      userId: userId.toString(),
      orderIds: JSON.stringify(
        Array.isArray(orderIds)
          ? orderIds.map((id) => id.toString())
          : [String(orderIds)],
      ), // ✅ Array safely stringified
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
