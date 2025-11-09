import { Types } from "mongoose";

export interface IOrders {
  userId: Types.ObjectId;
  cartIds: Types.ObjectId[]; // references Meal documents
  totalAmount: number;
  tip?: number;
  orderNo: string;
  status:
    | "new"
    | "in_preparation"
    | "ready_for_pickup"
    | "completed"
    | "cancelled";
  statusHistory?: {
    status: string;
    changedAt: Date;
  }[];
  pickUpDate: Date; // "Today" | "Tomorrow" or actual date
  pickUpTime: string; // e.g. "4PM–5PM"
  specialInstructions?: string; // optional note from user
  createdAt?: Date;
  updatedAt?: Date;
}
