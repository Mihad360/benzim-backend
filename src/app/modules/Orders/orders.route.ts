import express from "express";
import auth from "../../middlewares/auth";
import { orderControllers } from "./orders.controller";

const router = express.Router();

router.patch(
  "/tip/:orderId",
  auth("cook", "admin", "user"),
  orderControllers.addTip,
);
router.post(
  "/create",
  auth("cook", "admin", "user"),
  orderControllers.createOrder,
);

export const orderRoutes = router;
