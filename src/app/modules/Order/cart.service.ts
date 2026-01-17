import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { JwtPayload } from "../../interface/global";
import { ICart } from "./cart.interface";
import { CartModel } from "./cart.model";
import { CookProfileModel } from "../Cook/cook.model";
import { MealModel } from "../Meal/meal.model";
import { UserModel } from "../User/user.model";
import { Types } from "mongoose";
import QueryBuilder from "../../builder/QueryBuilder";
import { generateOrderId } from "./cart.utils";

export const orderSearchTerms: string[] = [
  "quantity",
  "totalPrice",
  "status", // Added status to search terms
  "orderId", // Added orderId to search terms
];

import mongoose from "mongoose";

const addToCartMeal = async (
  mealId: string,
  payload: ICart,
  user: JwtPayload,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = new Types.ObjectId(user.user);
    const quantity = payload.quantity || 1;

    // 🧩 1️⃣ Validate user
    const isUserExist = await UserModel.findById(userId).session(session);
    if (!isUserExist) {
      throw new AppError(HttpStatus.NOT_FOUND, "User not found");
    }

    // 🧩 2️⃣ Validate meal
    const meal = await MealModel.findById(mealId).session(session);
    if (!meal) {
      throw new AppError(HttpStatus.NOT_FOUND, "Meal not found");
    }

    // 🧩 3️⃣ Validate cook
    const cook = await CookProfileModel.findById(meal.cookId).session(session);
    if (!cook) {
      throw new AppError(HttpStatus.NOT_FOUND, "Cook not found for this meal");
    }

    // 🧩 3.5️⃣ Single-cook cart validation
    const cartFromAnotherCook = await CartModel.findOne({
      userId: isUserExist._id,
      cookId: { $ne: cook._id },
      isDeleted: false,
    }).session(session);

    if (cartFromAnotherCook) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "You can only order meals from one cook at a time. Please clear your cart first.",
      );
    }

    // 🧩 4️⃣ Update existing cart item (atomic)
    const updatedCart = await CartModel.findOneAndUpdate(
      {
        userId: isUserExist._id,
        mealId: meal._id,
        cookId: cook._id,
        isDeleted: false,
      },
      {
        $inc: { quantity },
        $set: {
          totalPrice: meal.price * quantity,
        },
      },
      {
        new: true,
        session,
      },
    );

    if (updatedCart) {
      await session.commitTransaction();
      session.endSession();
      return updatedCart;
    }

    // 🆕 5️⃣ Create new cart item
    const orderId = await generateOrderId();

    const [newOrder] = await CartModel.create(
      [
        {
          orderId,
          userId: isUserExist._id,
          cookId: cook._id,
          mealId: meal._id,
          quantity,
          totalPrice: meal.price * quantity,
          status: "pending",
        },
      ],
      { session },
    );

    await session.commitTransaction();
    session.endSession();
    return newOrder;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

const excludeAoRder = async (cartId: string, user: JwtPayload) => {
  const userId = new Types.ObjectId(user.user);
  // console.log(cartId);
  // 1️⃣ Validate user
  const userExist = await UserModel.findById(userId);
  if (!userExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  // 3️⃣ Validate cook
  const cart = await CartModel.findById(cartId);
  if (!cart) {
    throw new AppError(HttpStatus.NOT_FOUND, "Cart not found for this meal");
  }

  const meal = await MealModel.findById(cart.mealId);
  if (!meal) {
    throw new AppError(HttpStatus.NOT_FOUND, "Meal not found for this meal");
  }

  const existingOrder = await CartModel.findOne({
    _id: cart._id,
    userId: userExist._id,
    isDeleted: false,
  });

  // ❌ If no order found
  if (!existingOrder) {
    throw new AppError(HttpStatus.BAD_REQUEST, "No existing order to exclude");
  }

  // Additional safety check
  if (existingOrder.quantity >= 1) {
    existingOrder.quantity -= 1;
    existingOrder.totalPrice = meal.price * existingOrder.quantity;
    await existingOrder.save();
  } else {
    // Handle case where quantity is already 0
    throw new AppError(HttpStatus.BAD_REQUEST, "Order quantity is already 0");
  }

  return { message: "Order quantity decreased", order: existingOrder };
};

const getOrders = async (user: JwtPayload, query: Record<string, unknown>) => {
  const userId = new Types.ObjectId(user.user);
  const isUserExist = await UserModel.findById(userId);

  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  let orderQuery;

  if (isUserExist.role === "cook") {
    const isCookExist = await CookProfileModel.findOne({
      userId: isUserExist._id,
    });
    if (!isCookExist) {
      throw new AppError(HttpStatus.NOT_FOUND, "Cook not found");
    }
    orderQuery = CartModel.find({
      cookId: isCookExist._id,
      isDeleted: false,
      status: { $nin: ["completed", "cancelled"] }, // ✅ Exclude completed and cancelled
    })
      .populate({ path: "mealId", select: "imageUrls mealName price" })
      .populate({ path: "cookId", select: "rating" });
  } else if (isUserExist.role === "user") {
    orderQuery = CartModel.find({
      userId: isUserExist._id,
      isDeleted: false,
      status: { $nin: ["completed", "cancelled"] }, // ✅ Exclude completed and cancelled
    })
      .populate({ path: "mealId", select: "imageUrls mealName price" })
      .populate({ path: "cookId", select: "rating" });
  } else {
    throw new AppError(HttpStatus.FORBIDDEN, "Invalid user role");
  }

  const orders = new QueryBuilder(orderQuery, query)
    .search(orderSearchTerms)
    .filter()
    .fields()
    .paginate()
    .sort();

  const meta = await orders.countTotal();
  const result = await orders.modelQuery;

  if (!result || result.length === 0) {
    throw new AppError(HttpStatus.NOT_FOUND, "Orders not found");
  }

  const totalQuantity = result.reduce((sum, res) => sum + res.quantity, 0);
  const totalPrice = result.reduce((sum, res) => sum + res.totalPrice, 0);

  return { meta, quantities: totalQuantity, totalPrice: totalPrice, result };
};

const removeOrder = async (orderId: string) => {
  const order = await CartModel.findById(orderId);
  if (!order) {
    throw new AppError(HttpStatus.NOT_FOUND, "Order not found");
  }

  // Soft delete instead of hard delete
  order.isDeleted = true;
  await order.save();

  return { message: "Order removed successfully" };
};

export const cartServices = {
  addToCartMeal,
  getOrders,
  removeOrder,
  excludeAoRder,
};
