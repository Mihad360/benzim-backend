import { model, Schema } from "mongoose";
import { IReview } from "./review.interface";

const ReviewSchema = new Schema<IReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    cookId: { type: Schema.Types.ObjectId, ref: "Cook" },
    mealId: { type: Schema.Types.ObjectId, ref: "Meal" },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const ReviewModel = model<IReview>("Review", ReviewSchema);
