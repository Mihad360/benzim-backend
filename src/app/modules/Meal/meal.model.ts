import mongoose, { model, Schema } from "mongoose";
import { IMeal } from "./meal.interface";

const mealSchema = new mongoose.Schema<IMeal>(
  {
    cookId: { type: Schema.Types.ObjectId, ref: "Cook" },
    mealName: { type: String, required: true },
    description: { type: String, required: true },
    cuisineName: {
      type: String,
      enum: [
        "italian",
        "chinese",
        "indian",
        "thai",
        "japanese",
        "mexican",
        "french",
        "american",
        "mediterranean",
        "greek",
        "spanish",
        "korean",
        "vietnamese",
        "turkish",
        "middle eastern",
        "caribbean",
        "african",
        "british",
        "german",
        "brazilian",
      ],
    },
    availablePortion: { type: Number, required: true },
    dietaryCategories: {
      type: String,
      // enum: ["Vegan", "Halal", "Gluten Free", "Vegetarian"],
    },
    category: {
      type: String,
      // enum: ["Main", "Dessert", "Snacks", "Drinks"],
      required: true,
    },
    fitnessFlow: {
      type: String,
      // enum: ["Protein", "Low Carb", "Smoothies"],
      default: "Protein",
    },
    cheatFlow: {
      type: String,
      // enum: ["Comfort", "Sweet", "Street Food"],
      default: "Comfort",
    },

    timeForOrder: String,
    timeForPickUpFood: String,
    pricePerPortion: { type: Number, required: true },
    servedWarm: {
      type: String,
      enum: ["Warm", "Cold"],
      default: "Warm",
    },
    coldReheatPrice: { type: Number, default: 0 },
    ingredients: { type: [String], default: [] },
    allergyInformation: { type: String, default: "" },
    price: { type: Number, required: true },
    location: { type: String, default: "" },
    pickUpTime: { type: String, default: "" },
    offer: { type: String, default: "" },
    kcalories: { type: String, default: "" },
    imageUrls: { type: [String], default: [] },
  },
  { timestamps: true },
);

export const MealModel = model<IMeal>("Meal", mealSchema);

// dietaryCategories: [
//   {
//     type: Schema.Types.ObjectId,
//     ref: "Category",
//   },
// ],
// category: [
//   {
//     type: Schema.Types.ObjectId,
//     ref: "Category",
//   },
// ],
// fitnessFlow: [
//   {
//     type: Schema.Types.ObjectId,
//     ref: "Category",
//   },
// ],
// cheatFlow: [
//   {
//     type: Schema.Types.ObjectId,
//     ref: "Category",
//   },
// ],
