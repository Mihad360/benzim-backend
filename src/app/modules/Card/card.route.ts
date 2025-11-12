import express from "express";
import { cardControllers } from "./card.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.post(
  "/add-payment-card",
  auth("user", "cook"),
  cardControllers.addPaymentCard,
);

export const cardRoutes = router;
