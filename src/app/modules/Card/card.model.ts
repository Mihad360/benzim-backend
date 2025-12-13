import { model, Schema } from "mongoose";
import { ICard } from "./card.interface";

const cardSchema = new Schema<ICard>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cardNumber: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      enum: [
        "visa",
        "mastercard",
        "googlepay",
        "discover",
        "jcb",
        "diners",
        "unionpay",
        "twint",
        "applepay",
      ],
      required: true,
    },
    cvc: {
      type: String,
      required: true,
      trim: true,
    },
    exp_month: {
      type: Number,
      required: true,
    },
    exp_year: {
      type: Number,
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const CardModel = model<ICard>("Card", cardSchema);
