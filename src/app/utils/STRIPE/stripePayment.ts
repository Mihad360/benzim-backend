import HttpStatus from "http-status";
import { stripe } from "./stripe.config";
import { IPaymentMetadata } from "../../modules/Payment/payment.interface";
import { OrderModel } from "../../modules/Orders/orders.model";
import AppError from "../../erros/AppError";
import { ExtendOrderMealId } from "../../modules/Orders/orders.interface";

export const Payment = async (metadata: IPaymentMetadata) => {
  try {
    const { email, totalAmount, userId, orderId } = metadata;

    // ✅ Stripe metadata must be string | number | null only
    const stripeMetadata: Record<string, string> = {
      userId: userId.toString(),
      orderId: orderId.toString(),
      totalAmount: totalAmount.toString(),
    };

    const isOrderExist = (await OrderModel.findOne({
      _id: orderId,
    }).populate({
      path: "cartIds",
      select: "mealId",
      populate: { path: "mealId", select: "imageUrls" },
    })) as Partial<ExtendOrderMealId>;
    if (!isOrderExist) {
      throw new AppError(HttpStatus.NOT_FOUND, "Order not found");
    }
    // ✅ Extract image URLs from all meals
    const imageUrls = isOrderExist.cartIds
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ?.flatMap((cart: any) => cart.mealId?.imageUrls || [])
      .slice(0, 8); // Stripe supports up to 8 image

    console.log("🖼️ Image URLs for Stripe:", imageUrls);

    const unitAmount = Math.round(Number(totalAmount) * 100);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: unitAmount, // cents
            product_data: {
              name: `Payment for order #${orderId}`,
              images: imageUrls?.length ? imageUrls : undefined,
            },
          },
          quantity: 1,
        },
      ],
      customer_email: email,
      success_url: "http://localhost:5173/stripe/success",
      cancel_url: `http://localhost:5000/stripe/cancel`,
      metadata: stripeMetadata,
    });

    return session.url;
  } catch (error) {
    console.error("❌ Stripe payment creation error:", error);
    throw error;
  }
};
