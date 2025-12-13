import Stripe from "stripe";
import { payAmount } from "../../modules/Payment/payment.service";
import { Types } from "mongoose";

export const handleCheckoutSessionCompleted = async (
  session: Stripe.Checkout.Session,
) => {
  const { metadata } = session;
  console.log("🔹 Stripe metadata received:", metadata);

  if (metadata) {
    // ✅ Parse stringified array safely
    let parsedOrderIds: Types.ObjectId[] = [];

    try {
      const parsed = JSON.parse(metadata.orderIds || "[]"); // returns string[]
      parsedOrderIds = parsed.map((id: string) => new Types.ObjectId(id));
    } catch (err) {
      console.error("❌ Failed to parse orderIds:", err);
    }

    const payload = {
      ...metadata,
      orderIds: parsedOrderIds, // ✅ now actual ObjectId[]
      totalAmount: Number(metadata.totalAmount),
      tip: Number(metadata.tip),
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await payAmount(payload as any);
    console.log("✅ Payment saved:", result);
  }
};
