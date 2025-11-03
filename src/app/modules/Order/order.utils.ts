import { OrderModel } from "./order.model";

export const generateOrderId = async (): Promise<string> => {
  // Find the last added order, sorted by orderId descending
  const lastOrder = await OrderModel.findOne()
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
