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

  try {
    const userId = new Types.ObjectId(user.user);

    if (!payload.cartIds || payload.cartIds.length === 0) {
      throw new AppError(HttpStatus.BAD_REQUEST, "No cartIds provided");
    }

    // Fetch carts
    const carts = await CartModel.find(
      {
        _id: { $in: payload.cartIds },
        userId,
        isDeleted: false,
        status: "pending",
      },
      null,
      { session },
    )
      .populate({ path: "cookId", select: "userId cookName" })
      .populate({ path: "mealId", select: "availablePortion name price" }); // ✅ Added 'price'

    if (!carts.length) {
      throw new AppError(HttpStatus.NOT_FOUND, "No valid carts found");
    }

    // ===============================
    // 🔒 Ensure all carts belong to ONE cook
    // ===============================
    const firstCookId = carts[0].cookId._id.toString();

    const hasDifferentCook = carts.some(
      (cart) => cart.cookId._id.toString() !== firstCookId,
    );

    if (hasDifferentCook) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "You cannot place an order from multiple cooks",
      );
    }

    const cookId = new mongoose.Types.ObjectId(firstCookId);

    // ===============================
    // 💬 Create / Find conversation
    // ===============================
    let conversation = await ConversationModel.findOne(
      {
        cookId: (carts[0].cookId as any).userId,
        userId,
        isDeleted: false,
      },
      null,
      { session },
    );

    if (!conversation) {
      const conversationData = await ConversationModel.create(
        [
          {
            cookId: (carts[0].cookId as any).userId,
            userId,
          },
        ],
        { session },
      );

      conversation = conversationData[0];
    }

    // ===============================
    // 💰 Calculate amounts - FIXED
    // ===============================
    // ✅ Calculate total by multiplying each meal's price by its quantity
    let totalAmount = 0;

    carts.forEach((cart) => {
      const mealPrice = (cart.mealId as any)?.price || 0;
      const quantity = cart.quantity || 1;
      const cartTotal = mealPrice * quantity;

      totalAmount += cartTotal;

      // Debug log
      console.log(
        `Cart: Meal=${(cart.mealId as any)?.name}, Price=${mealPrice}, Qty=${quantity}, Total=${cartTotal}`,
      );
    });

    console.log(`Order Total (before fees): ${totalAmount}`);

    const tip = payload.tip ?? 0;
    const orderNo = await generateOrderNo();
    const STRIPE_FEE_PERCENT = 2.9;

    // 🔥 Calculate Stripe fee (cash)
    const stripeFeeCash = (totalAmount * STRIPE_FEE_PERCENT) / 100;

    // 🔥 Final payable amount
    const payableAmount = totalAmount + stripeFeeCash + tip;

    console.log(
      `Stripe Fee: ${stripeFeeCash}, Tip: ${tip}, Final Amount: ${payableAmount}`,
    );

    const statusHistory = [{ status: "new", changedAt: new Date() }];

    // ===============================
    // 🧾 Create order
    // ===============================
    const orderData: IOrders = {
      ...payload,
      userId,
      cookId, // ✅ single cookId
      conversationId: conversation._id, // ✅ single conversation
      totalAmount: roundToCent(payableAmount),
      stripeFee: roundToCent(stripeFeeCash),
      tip: Number(tip),
      orderNo,
      status: "new",
      statusHistory,
    };

    const [newOrder] = await OrderModel.create([orderData], { session });

    // ===============================
    // 🔥 Validate meal availability
    // ===============================
    for (const cart of carts) {
      const meal: any = cart.mealId;
      const orderedQty = cart.quantity || 1;

      if (!meal || meal.availablePortion < orderedQty) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          `${meal?.name || "Meal"} is not available in requested quantity`,
        );
      }
    }

    // ===============================
    // 🔥 Update meal stock
    // ===============================
    for (const cart of carts) {
      await MealModel.findByIdAndUpdate(
        (cart.mealId as any)._id,
        { $inc: { availablePortion: -(cart.quantity || 1) } },
        { session },
      );
    }

    // ===============================
    // 🧹 Soft delete carts after order
    // ===============================
    // await CartModel.updateMany(
    //   { _id: { $in: payload.cartIds } },
    //   { status: true },
    //   { session },
    // );

    await session.commitTransaction();
    session.endSession();

    return newOrder;
  } catch (error) {
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
      select: "mealId quantity totalPrice stripeFee",
      populate: {
        path: "mealId",
        select: "mealName imageUrls pricePerPortion price description",
      },
    })
    .populate({
      path: "cookId",
      select: "cookName profileImage rating _id",
    });

  if (!order) {
    throw new AppError(HttpStatus.NOT_FOUND, "Order not found");
  }

  // Handle cookId as a single object (not an array)
  const cook: any = order.cookId;

  const formattedOrder = {
    orderId: order._id,
    orderNo: order.orderNo,
    totalAmount: order.totalAmount,
    stripeFee: order.stripeFee,
    tip: order.tip || 0,
    conversationId: order.conversationId || [],
    promoCode: order.promoCode || null,
    status: order.status,
    shipingAddress: order.shipingAddress,
    createdAt: order.createdAt,

    // Single cook object instead of array
    cook: cook
      ? {
          cookId: cook._id,
          cookName: cook.cookName,
          image: cook.profileImage || null,
          rating: cook.rating || 0,
        }
      : null,

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
