import { Types } from "mongoose";

export interface ICategory {
  cookId?: Types.ObjectId; // optional - if each cook can create custom categories
  name: string; // e.g. "Vegan", "Halal"
  type: "dietary" | "meal" | "cheat" | "fitness"; // e.g. dietary filter vs meal category
  isActive: boolean;
  isDeleted: boolean;
}
// [
//   {
//     "cookId": "68ff39c764054f6f1b5a8edd",
//     "name": "Vegan",
//     "type": "dietary"
//   },
//   {
//     "cookId": "68ff39c764054f6f1b5a8edd",
//     "name": "Halal",
//     "type": "dietary"
//   },
//   {
//     "cookId": "68ff39c764054f6f1b5a8edd",
//     "name": "Gluten Free",
//     "type": "dietary"
//   },
//   {
//     "cookId": "68ff39c764054f6f1b5a8edd",
//     "name": "Vegetarian",
//     "type": "dietary"
//   },

//   {
//     "cookId": "68ff39c764054f6f1b5a8edd",
//     "name": "Main",
//     "type": "meal"
//   },
//   {
//     "cookId": "68ff39c764054f6f1b5a8edd",
//     "name": "Dessert",
//     "type": "meal"
//   },
//   {
//     "cookId": "68ff39c764054f6f1b5a8edd",
//     "name": "Snacks",
//     "type": "meal"
//   },
//   {
//     "cookId": "68ff39c764054f6f1b5a8edd",
//     "name": "Drinks",
//     "type": "meal"
//   },

//   {
//     "cookId": "68ff39c764054f6f1b5a8edd",
//     "name": "Protein",
//     "type": "fitness"
//   },
//   {
//     "cookId": "68ff39c764054f6f1b5a8edd",
//     "name": "Low Carb",
//     "type": "fitness"
//   },
//   {
//     "cookId": "68ff39c764054f6f1b5a8edd",
//     "name": "Smoothies",
//     "type": "fitness"
//   },

//   {
//     "cookId": "68ff39c764054f6f1b5a8edd",
//     "name": "Comfort",
//     "type": "cheat"
//   },
//   {
//     "cookId": "68ff39c764054f6f1b5a8edd",
//     "name": "Sweet",
//     "type": "cheat"
//   },
//   {
//     "cookId": "68ff39c764054f6f1b5a8edd",
//     "name": "Street Food",
//     "type": "cheat"
//   }
// ]
