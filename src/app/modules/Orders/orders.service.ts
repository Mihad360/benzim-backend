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

export const orderServices = {
  createOrder,
  addTip,
};
