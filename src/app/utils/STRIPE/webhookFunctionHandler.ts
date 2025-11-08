import Stripe from "stripe";
import { payAmount } from "../../modules/Payment/payment.service";

export const handleCheckoutSessionCompleted = async (
  session: Stripe.Checkout.Session,
) => {
  const { metadata } = session;
  console.log(metadata);
  if (metadata) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await payAmount(metadata as any);
    console.log(result);
  }
};
