import express from "express";
import auth from "../../middlewares/auth";
import { paymentControllers } from "./payment.controller";

const router = express.Router();

router.post(
  "/create-payment",
  auth("cook", "admin", "user"),
  paymentControllers.createPayment,
);

export const paymentRoutes = router;
