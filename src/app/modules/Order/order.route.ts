import express from "express";
import auth from "../../middlewares/auth";
import { orderControllers } from "./order.controller";

const router = express.Router();

router.get("/", auth("cook", "admin", "user"), orderControllers.getOrders);
router.delete(
  "/:orderId",
  auth("cook", "admin", "user"),
  orderControllers.removeOrder,
);
router.patch(
  "/status/:orderId",
  auth("cook", "admin"),
  orderControllers.updateOrderStatus,
);
router.post(
  "/exclude-order/:mealId",
  auth("cook", "admin", "user"),
  orderControllers.excludeAoRder,
);
router.post(
  "/order-meal/:mealId",
  auth("cook", "admin", "user"),
  orderControllers.orderMeal,
);

export const orderRoutes = router;
