import express from "express";
import auth from "../../middlewares/auth";
import { orderControllers } from "./orders.controller";

const router = express.Router();

router.get(
  "/current-orders",
  auth("cook", "admin", "user"),
  orderControllers.myCurrentOrders,
);
router.get(
  "/recent-orders",
  auth("cook", "admin", "user"),
  orderControllers.recentOrders,
);
router.get(
  "/:orderId",
  auth("cook", "admin", "user"),
  orderControllers.getEachOrder,
);
router.patch(
  "/tip/:orderId",
  auth("cook", "admin", "user"),
  orderControllers.addTip,
);
router.patch(
  "/status/:orderId",
  auth("cook", "admin"),
  orderControllers.updateOrderStatus,
);
router.patch(
  "/address/:orderId",
  auth("cook", "admin", "user"),
  orderControllers.updateAddress,
);
router.post(
  "/create",
  auth("cook", "admin", "user"),
  orderControllers.createOrder,
);

export const orderRoutes = router;
