import { Types } from "mongoose";

export interface IMeal {
  _id?: string;
  cookId: Types.ObjectId;
  mealName: string;
  description: string;
  imageUrls?: string[];
  availablePortion: number;
  dietaryCategories: "Vegan" | "Halal" | "Gluten Free" | "Vegetarian";
  //   dietaryCategories: Types.ObjectId[];
  category: "Main" | "Dessert" | "Snacks" | "Drinks";
  //   category: Types.ObjectId[];
  fitnessFlow: "Protein" | "Low Carb" | "Smoothies";
  //   fitnessFlow: Types.ObjectId[];
  cheatFlow: "Comfort" | "Sweet" | "Street Food";
  //   cheatFlow: Types.ObjectId[];
  timeForOrder?: string; // e.g. "9 AM - 12 PM"
  timeForPickUpFood?: string; // e.g. "6 PM - 8:30 PM"
  pricePerPortion: number;
  servedWarm: "Warm" | "Cold";
  coldReheatPrice?: number;
  ingredients: string[];
  allergyInformation?: string;
  price: number;
  location?: string;
  pickUpTime?: string;
  offer?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
