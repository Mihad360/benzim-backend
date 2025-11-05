import { Types } from "mongoose";

export interface IOffer {
  _id?: string;
  cookId: Types.ObjectId; // optional, if offer belongs to specific cook
  title: string;
  image?: string;
  code: string;
  offerScope: "meal" | "category" | "delivery" | "global";
  discountType: "percentage" | "flat";
  discountValue: number;

  applicableMealIds?: string[]; // for meal-specific offers
  applicableCategory?: string[]; // for category offers

  startDate?: Date;
  endDate?: Date;
  isActive: boolean;
  isDeleted: boolean;
}
