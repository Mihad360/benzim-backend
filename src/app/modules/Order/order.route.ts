import express from "express";
import auth from "../../middlewares/auth";
import { orderControllers } from "./order.controller";

const router = express.Router();

router.get("/", auth("cook", "admin"), orderControllers.getOrders);
router.patch(
  "/status/:orderId",
  auth("cook", "admin"),
  orderControllers.updateOrderStatus,
);
router.post(
  "/order-meal/:mealId",
  auth("cook", "admin", "user"),
  orderControllers.orderMeal,
);

export const orderRoutes = router;
