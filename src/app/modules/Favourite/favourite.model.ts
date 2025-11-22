import { model, Schema } from "mongoose";
import { IFavorite } from "./favourite.interface";

const favoriteSchema = new Schema<IFavorite>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    cookId: { type: Schema.Types.ObjectId, ref: "Cook", default: null },
    mealId: { type: Schema.Types.ObjectId, ref: "Meal", default: null },
    type: {
      type: String,
      enum: ["cook", "meal"],
      required: true,
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const FavoriteModel = model<IFavorite>("Favorite", favoriteSchema);
