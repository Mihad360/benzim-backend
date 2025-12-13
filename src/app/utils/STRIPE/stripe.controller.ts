import { Request, Response } from "express";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { stripe } from "./stripe.config";

export const createPaymentIntent = catchAsync(
  async (req: Request, res: Response) => {
    const { amount, currency = "usd" } = req.body;

    if (!amount) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Amount is required");
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount, // in cents
      currency,
      automatic_payment_methods: { enabled: true }, // supports Mastercard, Apple Pay, etc.
    });

    sendResponse(res, {
      statusCode: HttpStatus.OK,
      success: true,
      message: "Payment intent created successfully",
      data: { clientSecret: paymentIntent.client_secret },
    });
  },
);
