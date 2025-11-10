import { OrderModel } from "../Orders/orders.model";
import { CartModel } from "./cart.model";

export const generateOrderId = async (): Promise<string> => {
  // Find the last added order, sorted by orderId descending
  const lastOrder = await CartModel.findOne()
    .sort({ createdAt: -1 })
    .select("orderId");

  let newOrderId = 100; // Default start value

  if (lastOrder && lastOrder.orderId) {
    // Convert last orderId to number and increment by 1
    const lastId = parseInt(lastOrder.orderId, 10);
    if (!isNaN(lastId)) {
      newOrderId = lastId + 1;
    }
  }

  return newOrderId.toString();
};

export const generateOrderNo = async (): Promise<string> => {
  // Find the last added order, sorted by createdAt descending
  const lastOrder = await OrderModel.findOne()
    .sort({ createdAt: -1 })
    .select("orderNo");

  let newOrderId = 1000; // Default start value

  if (lastOrder && lastOrder.orderNo) {
    // Extract the numeric part from the last orderNo (assumes format: "ORD-1000")
    const match = lastOrder.orderNo.match(/\d+$/);
    if (match) {
      const lastId = parseInt(match[0], 10);
      if (!isNaN(lastId)) {
        newOrderId = lastId + 1;
      }
    }
  }

  return `ORD-${newOrderId}`;
};
