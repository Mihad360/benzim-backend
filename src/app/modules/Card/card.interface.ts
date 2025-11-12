import { Types } from "mongoose";

export interface ICard {
  userId: Types.ObjectId; // Link to your user
  cardNumber: string; // Stripe customer ID (cus_xxx)
  name: string; // Stripe payment method ID (pm_xxx)
  brand: string; // e.g., "visa"
  cvc: string; // e.g., "4242"
  exp_month: number;
  exp_year: number;
  isDeleted: boolean;
}
