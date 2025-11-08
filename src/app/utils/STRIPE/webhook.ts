/* eslint-disable no-case-declarations */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import express from "express";
import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import sendResponse from "../sendResponse";
import config from "../../config";
import { stripe } from "./stripe.config";
import catchAsync from "../catchAsync";
import Stripe from "stripe";
import { handleCheckoutSessionCompleted } from "./webhookFunctionHandler";

const endpointSecret = config.stripe_webhook as string;
// console.log(endpointSecret);
export const stripeWebhookHandler = catchAsync(async (req, res) => {
  let event: Stripe.Event;

  if (endpointSecret) {
    const signature = req.headers["stripe-signature"] as string | undefined;
    // console.log(signature);
    if (!signature || typeof signature !== "string") {
      res.status(400).send("Missing or invalid Stripe signature");
      return;
    }

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        endpointSecret,
      );
    } catch (err: any) {
      console.error("⚠️ Webhook signature verification failed:", err.message);
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        `Webhook Error: ${err.message}`,
      );
    }
  } else {
    // If no endpoint secret is configured, use the raw body
    event = req.body as Stripe.Event;
  }

  // 🧩 Handle Stripe events
  try {
    switch (event.type) {
      // 🟢 Checkout Session completed (your main payment event)
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        console.log(
          "✅ Checkout session completed:",
          JSON.stringify(session, null, 2),
        );

        await handleCheckoutSessionCompleted(session);

        break;

      // 🟢 PaymentIntent succeeded
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(
          "✅ PaymentIntent succeeded:",
          JSON.stringify(paymentIntent, null, 2),
        );
        break;

      // 🟢 Payment method attached
      case "payment_method.attached":
        const paymentMethod = event.data.object as Stripe.PaymentMethod;
        console.log(
          "💳 Payment method attached:",
          JSON.stringify(paymentMethod, null, 2),
        );
        break;

      // 🔘 Default
      default:
        console.log(`⚙️ Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.log("Error handling Stripe event:", error);
  }

  // ✅ Send success response
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Stripe webhook received successfully",
    data: { eventType: event.type },
  });
});
