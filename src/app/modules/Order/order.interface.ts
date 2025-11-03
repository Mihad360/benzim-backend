import { Types } from "mongoose";

export interface IOrder {
  userId: Types.ObjectId; // who placed the order
  cookId: Types.ObjectId; // which cook is preparing it
  mealId: Types.ObjectId; // which meal was ordered
  orderId: string;
  quantity: number; // portions ordered
  totalPrice: number; // quantity * meal.pricePerPortion
  status:
    | "new"
    | "in_preparation"
    | "ready_for_pickup"
    | "completed"
    | "cancelled";
  paymentStatus: "pending" | "paid" | "refunded";
  paymentMethod: "cash" | "online";
  pickUpDate: Date; // "Today" | "Tomorrow" or actual date
  pickUpTime: string; // e.g. "4PM–5PM"
  specialInstructions?: string; // optional note from user
  orderNotes?: string; // internal note by cook/admin
  statusHistory?: {
    status: string;
    changedAt: Date;
  }[];
  isDeleted: boolean;
}
