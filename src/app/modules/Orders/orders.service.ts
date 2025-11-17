/* eslint-disable @typescript-eslint/no-explicit-any */
import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { JwtPayload } from "../../interface/global";
import { generateOrderNo } from "../Order/cart.utils";
import { IOrders } from "./orders.interface";
import { OrderModel } from "./orders.model";
import { Types } from "mongoose";
import { CartModel } from "../Order/cart.model";
import { CookProfileModel } from "../Cook/cook.model";
import { ConversationModel } from "../Conversation/conversation.model";
import QueryBuilder from "../../builder/QueryBuilder";
import { UserModel } from "../User/user.model";

const createOrder = async (payload: IOrders, user: JwtPayload) => {
  const userId = new Types.ObjectId(user.user);

  if (!payload.cartIds || payload.cartIds.length === 0) {
    throw new AppError(HttpStatus.BAD_REQUEST, "No cartIds provided");
  }

  // Fetch all carts by IDs, ensure they belong to this user and are not deleted
  const carts = await CartModel.find({
    _id: { $in: payload.cartIds },
    userId,
    isDeleted: false,
  }).populate({ path: "cookId", select: "cookName" });

  if (!carts || carts.length === 0) {
    throw new AppError(HttpStatus.NOT_FOUND, "No valid carts found");
  }

  // Sum totalPrice from all carts
  const totalAmount = carts.reduce((acc, cart) => acc + cart.totalPrice, 0);

  // Use provided tip or default to 0
  const tip = payload.tip ?? 0;

  // Create orderNo (you can replace this with your own logic)
  const orderNo = await generateOrderNo();

  // Prepare statusHistory with initial "new" status
  const statusHistory = [{ status: "new", changedAt: new Date() }];

  // Create order document
  const orderData: IOrders = {
    ...payload,
    userId,
    totalAmount: parseFloat((totalAmount + tip).toFixed(2)),
    tip: parseFloat(tip.toFixed(2)),
    orderNo: orderNo,
    status: "new",
    statusHistory,
  };

  // Save order
  const newOrder = await OrderModel.create(orderData);

  const firstMealCookId = carts[0]?.cookId;
  if (firstMealCookId) {
    // Get cook’s userId from cook profile
    const cookProfile = await CookProfileModel.findById(firstMealCookId);

    if (cookProfile) {
      // Check if conversation already exists between this user and cook
      const existingConversation = await ConversationModel.findOne({
        cookId: cookProfile.userId,
        userId: userId,
        isDeleted: false,
      });

      if (!existingConversation) {
        // Create new conversation if not exist
        const conversation = await ConversationModel.create({
          cookId: cookProfile.userId,
          userId: userId,
        });

        if (!conversation) {
          throw new AppError(
            HttpStatus.INTERNAL_SERVER_ERROR,
            "Failed to create conversation",
          );
        }
      }
    }
  }

  return newOrder;
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
  const roundedTip = Number(tipAmount.toFixed(2));
  const roundedTotal = Number((baseAmount + roundedTip).toFixed(2));

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
    const formattedOrders = orders.map((order: any) => ({
      orderId: order._id,
      orderNo: order.orderNo,
      totalAmount: order.totalAmount,
      tip: order.tip || 0,
      promoCode: order.promoCode || null,
      status: order.status,
      statusHistory: order.statusHistory,
      createdAt: order.createdAt,

      // 🧑‍🍳 Cook order includes user info
      user:
        user.role === "cook"
          ? {
              name: order.userId?.name,
              email: order.userId?.email,
              profileImage: order.userId?.profileImage || null,
            }
          : undefined,

      // 🧑‍🦱 User order includes cook info
      cook:
        user.role === "user"
          ? {
              name: order.cookId?.name,
              bio: order.cookId?.bio,
              image: order.cookId?.userImage || null,
            }
          : undefined,

      // 🍽 Cart Items (Common for both)
      carts: order.cartIds.map((cart: any) => ({
        quantity: cart.quantity,
        totalPrice: cart.totalPrice,
        meal: {
          name: cart.mealId?.mealName,
          image: cart.mealId?.imageUrls?.[0] || null,
          description: cart.mealId?.description || "",
          price: cart.mealId?.price,
          pricePerPortion: cart.mealId?.pricePerPortion,
          statusHistory: cart.mealId?.statusHistory,
        },
      })),
    }));

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
  const order = await OrderModel.findOne({ _id: orderId, userId })
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
      select: "cookName profileImage",
    });

  if (!order) {
    throw new AppError(HttpStatus.NOT_FOUND, "Order not found");
  }

  const cook: any = order.cookId;

  const formattedOrder = {
    orderId: order._id,
    orderNo: order.orderNo,
    totalAmount: order.totalAmount,
    tip: order.tip || 0,
    promoCode: order.promoCode || null,
    status: order.status,
    createdAt: order.createdAt,

    cook: {
      cookName: cook?.cookName,
      image: cook?.profileImage || null,
    },

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
    orders = await OrderModel.find({ cookId: loggedUserId })
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

export const orderServices = {
  createOrder,
  addTip,
  myCurrentOrders,
  getEachOrder,
  recentOrders,
};
