/* eslint-disable @typescript-eslint/no-explicit-any */
import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { JwtPayload } from "../../interface/global";
import { generateOrderNo } from "../Order/cart.utils";
import { IOrders } from "./orders.interface";
import { OrderModel } from "./orders.model";
import mongoose, { Types } from "mongoose";
import { CartModel } from "../Order/cart.model";
import { CookProfileModel } from "../Cook/cook.model";
import { ConversationModel } from "../Conversation/conversation.model";
import QueryBuilder from "../../builder/QueryBuilder";
import { UserModel } from "../User/user.model";
import { MealModel } from "../Meal/meal.model";

export const roundToCent = (value: number) => {
  return Math.round(value * 100) / 100; // safest method
};

const createOrder = async (payload: IOrders, user: JwtPayload) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  console.log(payload.cartIds);
  try {
    const userId = new Types.ObjectId(user.user);

    if (!payload.cartIds || payload.cartIds.length === 0) {
      throw new AppError(HttpStatus.BAD_REQUEST, "No cartIds provided");
    }

    // Fetch carts (must belong to user)
    const carts = await CartModel.find(
      {
        _id: { $in: payload.cartIds },
        userId,
        isDeleted: false,
      },
      null,
      { session },
    )
      .populate({ path: "cookId", select: "cookName" })
      .populate({ path: "mealId", select: "availablePortion" });

    if (!carts || carts.length === 0) {
      throw new AppError(HttpStatus.NOT_FOUND, "No valid carts found");
    }

    // Calculate total amount
    const totalAmount = carts.reduce((acc, cart) => acc + cart.totalPrice, 0);

    const tip = payload.tip ?? 0;
    const orderNo = await generateOrderNo();

    const statusHistory = [{ status: "new", changedAt: new Date() }];

    // ================================
    // Extract unique cook IDs from carts
    // ================================
    const uniqueCookIds = [
      ...new Set(
        carts
          .map(
            (cart) => cart.cookId?._id?.toString() || cart.cookId?.toString(),
          )
          .filter(Boolean),
      ),
    ].map((id) => new mongoose.Types.ObjectId(id));

    // ===============================
    // 💬 Create/Find conversations for all unique cooks
    // ===============================
    const conversationIds: mongoose.Types.ObjectId[] = [];

    if (uniqueCookIds.length > 0) {
      for (const cookId of uniqueCookIds) {
        const cookProfile = await CookProfileModel.findById(cookId, null, {
          session,
        });

        if (cookProfile) {
          // Check if conversation already exists
          let conversation = await ConversationModel.findOne(
            {
              cookId: cookProfile.userId,
              userId,
              isDeleted: false,
            },
            null,
            { session },
          );

          // Create conversation if it doesn't exist
          if (!conversation) {
            const conversationData = await ConversationModel.create(
              [
                {
                  cookId: cookProfile.userId,
                  userId,
                },
              ],
              { session },
            );

            if (!conversationData?.length) {
              throw new AppError(
                HttpStatus.BAD_REQUEST,
                "Failed to create conversation",
              );
            }

            conversation = conversationData[0];
          }

          // Collect conversation ID
          conversationIds.push(conversation._id);
        }
      }
    }

    // ================================
    // Create order with conversation IDs
    // ================================
    const orderData: IOrders = {
      ...payload,
      userId,
      cookId: uniqueCookIds, // Array of cook ObjectIds
      conversationId: conversationIds, // Array of conversation ObjectIds
      totalAmount: roundToCent(totalAmount + tip),
      tip: Number(tip),
      orderNo,
      status: "new",
      statusHistory,
    };

    // Create order
    const newOrder = await OrderModel.create([orderData], { session });

    // ===============================
    // 🔥 Validate meal availability
    // ===============================
    const insufficientMeals: string[] = [];

    for (const cart of carts) {
      const meal: any = cart.mealId;
      const orderedQty = cart.quantity || 1;

      if (!meal) {
        insufficientMeals.push("Unknown meal");
        continue;
      }

      if (meal.availablePortion < orderedQty) {
        insufficientMeals.push(
          `${meal.name || "This meal"} (available: ${meal.availablePortion}, requested: ${orderedQty})`,
        );
      }
    }

    // 🚫 If any meal is insufficient, block order
    if (insufficientMeals.length > 0) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        `Some meals are not available in the requested quantity: ${insufficientMeals.join(
          ", ",
        )}`,
      );
    }

    // ===============================
    // 🔥 Update Meal availablePortion
    // ===============================
    for (const cart of carts) {
      const orderedQty = cart.quantity || 1;

      await MealModel.findByIdAndUpdate(
        (cart.mealId as any)._id,
        { $inc: { availablePortion: -orderedQty } },
        { session },
      );
    }

    // ✅ Commit transaction
    await session.commitTransaction();
    session.endSession();

    return newOrder[0];
  } catch (error) {
    // ❌ Rollback everything
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const addTip = async (
  orderId: string,
  payload: { tip: string | number },
) => {
  // 1️⃣ Find the order
  const order = await OrderModel.findById(orderId);
  if (!order) {
    throw new AppError(HttpStatus.NOT_FOUND, "Order not found");
  }

  const baseAmount = Number(order.totalAmount) || 0;
  let tipAmount = 0;

  // 2️⃣ Handle tip (percentage or fixed)
  if (typeof payload.tip === "string" && payload.tip.endsWith("%")) {
    const percentage = parseFloat(payload.tip.replace("%", ""));
    if (!isNaN(percentage)) {
      tipAmount = (baseAmount * percentage) / 100;
    }
  } else if (typeof payload.tip === "number") {
    tipAmount = payload.tip;
  } else if (typeof payload.tip === "string") {
    const numericTip = parseFloat(payload.tip);
    tipAmount = !isNaN(numericTip) ? numericTip : 0;
  }

  // 3️⃣ Round the values
  const roundedTip = roundToCent(tipAmount);
  const roundedTotal = roundToCent(baseAmount + roundedTip);

  // 4️⃣ Update the order in DB
  order.tip = roundedTip;
  order.totalAmount = roundedTotal;
  await order.save();

  return {
    tip: roundedTip,
    totalAmount: roundedTotal,
  };
};

const myCurrentOrders = async (
  user: JwtPayload,
  query: Record<string, unknown>,
) => {
  try {
    const userObjectId = new Types.ObjectId(user.user);
    const cook = await CookProfileModel.findOne({ userId: userObjectId });

    let baseQuery;

    // 🧠 Cook Request
    if (user.role === "cook") {
      if (!cook) {
        throw new AppError(HttpStatus.NOT_FOUND, "Cook not found");
      }

      baseQuery = OrderModel.find({
        cookId: cook._id,
        status: { $nin: ["completed", "cancelled"] },
      })
        .populate({
          path: "cartIds",
          select: "mealId quantity totalPrice",
          populate: {
            path: "mealId",
            select: "mealName imageUrls pricePerPortion price description",
          },
        })
        .populate({
          path: "userId",
          select: "name email profileImage",
        })
        .sort({ createdAt: -1 });
    }

    // 🧠 Normal User Request
    else if (user.role === "user") {
      baseQuery = OrderModel.find({
        userId: userObjectId,
        status: { $nin: ["completed", "cancelled"] },
      })
        .populate({
          path: "cartIds",
          select: "mealId quantity totalPrice",
          populate: {
            path: "mealId",
            select: "mealName imageUrls pricePerPortion price description",
          },
        })
        .populate({
          path: "cookId",
          select: "name bio userImage",
        })
        .sort({ createdAt: -1 });
    }

    // ❌ Invalid role
    else {
      throw new AppError(
        HttpStatus.UNAUTHORIZED,
        "You are not allowed to view these orders",
      );
    }

    // ✨ QueryBuilder
    const orderQuery = new QueryBuilder(baseQuery, query)
      .search(["orderNo", "status"])
      .filter()
      .paginate()
      .sort();

    const orders = await orderQuery.modelQuery;
    const meta = await orderQuery.countTotal();

    if (!orders || orders.length === 0) {
      throw new AppError(HttpStatus.NOT_FOUND, "Orders not found");
    }

    // 🎨 Unified Formatting for BOTH User & Cook
    const formattedOrders = orders.flatMap((order: any) =>
      order.cartIds.map((cart: any) => ({
        // 🧾 Order Info
        orderId: order._id,
        orderNo: order.orderNo,
        status: order.status,
        statusHistory: order.statusHistory,
        createdAt: order.createdAt,
        totalAmount: order.totalAmount,
        tip: order.tip || 0,
        promoCode: order.promoCode || null,

        // 🧑‍🍳 Cook → User Info
        user:
          user.role === "cook"
            ? {
                name: order.userId?.name,
                email: order.userId?.email,
                profileImage: order.userId?.profileImage || null,
              }
            : undefined,

        // 🧑‍🦱 User → Cook Info
        cook:
          user.role === "user"
            ? {
                name: order.cookId?.name,
                bio: order.cookId?.bio,
                image: order.cookId?.userImage || null,
              }
            : undefined,

        // 🍽 Cart Info (Flattened)
        cartId: cart._id,
        quantity: cart.quantity,
        totalPrice: cart.totalPrice,

        meal: {
          name: cart.mealId?.mealName,
          image: cart.mealId?.imageUrls?.[0] || null,
          description: cart.mealId?.description || "",
          price: cart.mealId?.price,
          pricePerPortion: cart.mealId?.pricePerPortion,
        },
      })),
    );

    return {
      meta,
      data: formattedOrders,
    };
  } catch (error: any) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      `Something went wrong: ${error.message || error}`,
    );
  }
};

const getEachOrder = async (orderId: string, user: JwtPayload) => {
  const userId = new Types.ObjectId(user.user);

  // 🔍 Validate user exists
  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  // 🔍 Fetch order with population
  const order = await OrderModel.findOne({ _id: orderId })
    .populate({
      path: "cartIds",
      select: "mealId quantity totalPrice",
      populate: {
        path: "mealId",
        select: "mealName imageUrls pricePerPortion price description",
      },
    })
    .populate({
      path: "cookId", // This is now an array
      select: "cookName profileImage rating _id",
    });

  if (!order) {
    throw new AppError(HttpStatus.NOT_FOUND, "Order not found");
  }

  // Handle cookId as array
  const cooks: any = order.cookId; // This is an array now

  const formattedOrder = {
    orderId: order._id,
    orderNo: order.orderNo,
    totalAmount: order.totalAmount,
    tip: order.tip || 0,
    conversationId: order.conversationId || [], // Array of conversation IDs
    promoCode: order.promoCode || null,
    status: order.status,
    shipingAddress: order.shipingAddress,
    createdAt: order.createdAt,

    // Map all cooks (now supporting multiple cooks)
    cooks:
      cooks?.map((cook: any) => ({
        cookId: cook?._id,
        cookName: cook?.cookName,
        image: cook?.profileImage || null,
        rating: cook?.rating || 0,
      })) || [],

    carts: order.cartIds.map((cart: any) => ({
      quantity: cart.quantity,
      totalPrice: cart.totalPrice,
      meal: {
        name: cart.mealId?.mealName,
        image: cart.mealId?.imageUrls?.[0] || null,
        description: cart.mealId?.description || "",
        price: cart.mealId?.price,
        pricePerPortion: cart.mealId?.pricePerPortion,
      },
    })),
  };

  return formattedOrder;
};

const updateAddress = async (
  orderId: string,
  payload: { shipingAddress: string },
) => {
  const order = await OrderModel.findByIdAndUpdate(
    orderId,
    {
      shipingAddress: payload.shipingAddress,
    },
    { new: true },
  );
  if (!order) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Address update failed");
  }
  return order;
};

const recentOrders = async (user: JwtPayload) => {
  const loggedUserId = new Types.ObjectId(user.user);
  let orders;

  // 👤 USER → find orders where this user placed them
  if (user.role === "user") {
    orders = await OrderModel.find({ userId: loggedUserId })
      .sort({ createdAt: -1 })
      .populate({
        path: "cookId",
        select: "cookName profileImage",
      })
      .populate({
        path: "cartIds",
        select: "quantity",
      });
  }

  // 🧑‍🍳 COOK → find orders where cookId = this cook
  else if (user.role === "cook") {
    const cookId = await UserModel.findById(loggedUserId);
    if (!cookId) {
      throw new AppError(HttpStatus.NOT_FOUND, "Cook not found");
    }
    orders = await OrderModel.find({ cookId: cookId.cookId })
      .sort({ createdAt: -1 })
      .populate({
        path: "userId",
        select: "name profileImage", // user info for cook
      })
      .populate({
        path: "cartIds",
        select: "quantity",
      });
  }

  // ❌ invalid roles
  else {
    throw new AppError(HttpStatus.FORBIDDEN, "Invalid role");
  }

  if (!orders || orders.length === 0) {
    throw new AppError(HttpStatus.NOT_FOUND, "No recent orders found");
  }

  // Formatting output for both roles
  const formatted = orders.map((order: any) => {
    const lastStatus =
      order.statusHistory?.[order.statusHistory.length - 1] || null;

    const totalQuantity = order.cartIds.reduce(
      (sum: number, cart: any) => sum + (cart.quantity ?? 0),
      0,
    );

    let profileName = null;
    let profileImage = null;

    // 🎯 USER sees COOK data
    if (user.role === "user") {
      profileName = order.cookId?.cookName || null;
      profileImage = order.cookId?.profileImage || null;
    }

    // 🎯 COOK sees USER data
    if (user.role === "cook") {
      profileName = order.userId?.name || null;
      profileImage = order.userId?.profileImage || null;
    }

    return {
      profileName,
      profileImage,
      createdAt: order.createdAt,
      status: order.status,
      lastStatusUpdate: lastStatus,
      totalQuantity,
      price: order.totalAmount,
    };
  });

  return formatted;
};

const updateOrderStatus = async (
  orderId: string,
  payload: {
    newStatus:
      | "new"
      | "in_preparation"
      | "ready_for_pickup"
      | "completed"
      | "cancelled";
  },
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { newStatus } = payload;

    // 1. Fetch order inside transaction
    const order = await OrderModel.findById(orderId).session(session).lean();

    if (!order) {
      throw new AppError(HttpStatus.NOT_FOUND, "Order not found");
    }

    // 2. Prepare statusHistory update → NO DUPLICATE ALLOWED
    const lastHistory = order.statusHistory?.[order.statusHistory.length - 1];
    let pushHistory = false;

    if (!lastHistory || lastHistory.status !== newStatus) {
      pushHistory = true;
    }

    // 3. Build update object dynamically
    const updateData: any = {
      status: newStatus,
    };

    if (pushHistory) {
      updateData.$push = {
        statusHistory: {
          status: newStatus,
          changedAt: new Date(),
        },
      };
    }

    // 4. Update the order document atomically
    const newOrder = await OrderModel.findOneAndUpdate(
      { _id: orderId },
      updateData,
      {
        new: true,
        session,
      },
    );

    // 5. If completed or cancelled → update all carts
    if (newStatus === "completed" || newStatus === "cancelled") {
      await CartModel.updateMany(
        { _id: { $in: order.cartIds } },
        { $set: { status: newStatus } },
        { session },
      );
    }

    await session.commitTransaction();
    session.endSession();

    return newOrder;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const orderServices = {
  createOrder,
  addTip,
  myCurrentOrders,
  getEachOrder,
  recentOrders,
  updateOrderStatus,
  updateAddress,
};
