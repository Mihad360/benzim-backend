/* eslint-disable no-case-declarations */
/* eslint-disable @typescript-eslint/no-explicit-any */
import config from "../../config";
import { stripe } from "./stripe.config";
import catchAsync from "../catchAsync";
import Stripe from "stripe";
import { handleCheckoutSessionCompleted } from "./webhookFunctionHandler";
import { UserModel } from "../../modules/User/user.model";

const platformEndpointSecret = config.stripe_platform_webhook as string;
const connectedEndpointSecret = config.stripe_connected_webhook as string;

export const stripeWebhookHandler = catchAsync(async (req, res) => {
  let event: Stripe.Event;

  if (platformEndpointSecret) {
    const signature = req.headers["stripe-signature"] as string | undefined;
    if (!signature || typeof signature !== "string") {
      console.error("❌ Missing or invalid Stripe signature");
      return res.status(400).send("Missing or invalid Stripe signature");
    }

    try {
      // Use the raw body that express.raw() middleware provided
      event = stripe.webhooks.constructEvent(
        req.body, // This is now the raw buffer
        signature,
        platformEndpointSecret,
      );
    } catch (err: any) {
      console.error("⚠️ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    event = req.body as Stripe.Event;
  }

  // Process the event...
  try {
    switch (event.type) {
      case "checkout.session.completed":
        const session = event.data.object as Stripe.Checkout.Session;
        console.log("✅ Checkout session completed");
        console.log(session.metadata);
        await handleCheckoutSessionCompleted(session);
        break;

      default:
        console.log(`⚙️ Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.log("Error handling Stripe event:", error);
    return res.status(500).json({ error: "Webhook handler failed" });
  }

  // Return a response to Stripe
  res.json({ received: true });
});

export const stripeConnectedWebhookHandler = catchAsync(async (req, res) => {
  let event: Stripe.Event;

  if (connectedEndpointSecret) {
    const signature = req.headers["stripe-signature"] as string | undefined;
    if (!signature || typeof signature !== "string") {
      console.error("❌ Missing or invalid Stripe signature");
      return res.status(400).send("Missing or invalid Stripe signature");
    }

    try {
      // Use the raw body that express.raw() middleware provided
      event = stripe.webhooks.constructEvent(
        req.body, // This is now the raw buffer
        signature,
        connectedEndpointSecret,
      );
    } catch (err: any) {
      console.error("⚠️ Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
  } else {
    event = req.body as Stripe.Event;
  }

  // Process the event...
  try {
    switch (event.type) {
      case "account.updated": {
        const account = event.data.object as Stripe.Account;
        console.log("🔄 account.updated:", account.id);

        if (account.details_submitted) {
          console.log("🎉 Cook onboarding completed:", account.id);
          await UserModel.findOneAndUpdate(
            { email: account.email },
            { stripeAccountId: account.id, isOnboarded: true },
            { new: true },
          );
        }
        break;
      }

      default:
        console.log(`⚙️ Unhandled event type: ${event.type}`);
    }
  } catch (error) {
    console.log("Error handling Stripe event:", error);
    return res.status(500).json({ error: "Webhook handler failed" });
  }

  // Return a response to Stripe
  res.json({ received: true });
});
