import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { JwtPayload } from "../../interface/global";
import { IOrder } from "./order.interface";
import { OrderModel } from "./order.model";
import { CookProfileModel } from "../Cook/cook.model";
import { MealModel } from "../Meal/meal.model";
import { UserModel } from "../User/user.model";
import { Types } from "mongoose";
import QueryBuilder from "../../builder/QueryBuilder";
import { generateOrderId } from "./order.utils";

export const orderSearchTerms: string[] = [
  "quantity",
  "totalPrice",
  "status",
  "paymentStatus",
  "paymentMethod",
  "pickUpDate",
  "pickUpTime",
  "specialInstructions",
  "orderNotes",
];

const orderMeal = async (mealId: string, payload: IOrder, user: JwtPayload) => {
  const userId = new Types.ObjectId(user.user);

  // 🧩 1️⃣ Check if user exists
  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  // 🧩 2️⃣ Check if meal exists
  const meal = await MealModel.findById(mealId);
  if (!meal) {
    throw new AppError(HttpStatus.NOT_FOUND, "Meal not found");
  }

  // 🧩 3️⃣ Find the cook (from meal)
  const cook = await CookProfileModel.findById(meal.cookId);
  if (!cook) {
    throw new AppError(HttpStatus.NOT_FOUND, "Cook not found for this meal");
  }

  // 🧩 4️⃣ Calculate total price
  const totalPrice = meal.pricePerPortion * payload.quantity;
  const orderId = await generateOrderId();
  payload.orderId = orderId;

  // 🧩 5️⃣ Create the order
  const newOrder = await OrderModel.create({
    ...payload,
    userId: isUserExist._id,
    cookId: cook._id,
    mealId: meal._id,
    quantity: payload.quantity,
    totalPrice,
    paymentMethod: payload.paymentMethod || "online",
    pickUpDate: payload.pickUpDate || "Today",
    pickUpTime: payload.pickUpTime || meal.pickUpTime || "",
    specialInstructions: payload.specialInstructions || "",
    statusHistory: {
      status: "new",
      changedAt: new Date(),
    },
  });

  return newOrder;
};

const getOrders = async (user: JwtPayload, query: Record<string, unknown>) => {
  const userId = new Types.ObjectId(user.user);
  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }
  const isCookExist = await CookProfileModel.findOne({
    userId: isUserExist._id,
  });
  if (!isCookExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Cook not found");
  }
  const orders = new QueryBuilder(
    OrderModel.find({ cookId: isCookExist._id, isDeleted: false }),
    query,
  )
    .search(orderSearchTerms)
    .filter()
    .fields()
    .paginate()
    .sort();

  if (!orders) {
    throw new AppError(HttpStatus.NOT_FOUND, "Orders not found");
  }
  const meta = await orders.countTotal();
  const result = await orders.modelQuery;
  return { meta, result };
};

const updateOrderStatus = async (
  orderId: string,
  payload: {
    newStatus:
      | "in_preparation"
      | "ready_for_pickup"
      | "completed"
      | "cancelled";
  },
) => {
  const order = await OrderModel.findById(orderId);
  if (!order) {
    throw new AppError(HttpStatus.NOT_FOUND, "Order not found");
  }

  order.status = payload.newStatus;
  order.statusHistory = order.statusHistory || [];
  order.statusHistory.push({
    status: payload.newStatus,
    changedAt: new Date(),
  });

  const updatedOrder = await order.save();
  return updatedOrder;
};

export const orderServices = {
  orderMeal,
  getOrders,
  updateOrderStatus,
};
