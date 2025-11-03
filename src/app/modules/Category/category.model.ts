import { model, Schema } from "mongoose";
import { ICategory } from "./category.interface";

const categorySchema = new Schema<ICategory>(
  {
    cookId: {
      type: Schema.Types.ObjectId,
      ref: "Cook",
      required: false, // global categories won't have this
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    type: {
      type: String,
      enum: ["dietary", "meal", "cheat", "fitness"],
      default: "dietary",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const CategoryModel = model<ICategory>("Category", categorySchema);
