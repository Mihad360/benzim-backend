import express from "express";
import auth from "../../middlewares/auth";
import { cartControllers } from "./cart.controller";

const router = express.Router();

router.get("/", auth("cook", "admin", "user"), cartControllers.getOrders);
router.delete(
  "/:orderId",
  auth("cook", "admin", "user"),
  cartControllers.removeOrder,
);
router.post(
  "/exclude-order/:cartId",
  auth("cook", "admin", "user"),
  cartControllers.excludeAoRder,
);
router.post(
  "/order-meal/:mealId",
  auth("cook", "admin", "user"),
  cartControllers.addToCartMeal,
);

export const cartRoutes = router;
