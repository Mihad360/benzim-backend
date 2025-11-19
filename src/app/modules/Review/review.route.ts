import express from "express";
import auth from "../../middlewares/auth";
import { reviewControllers } from "./review.controller";

const router = express.Router();

router.get("/", auth("cook", "admin", "user"), reviewControllers.getMyReviews);
router.post(
  "/give-review",
  auth("cook", "admin", "user"),
  reviewControllers.giveReview,
);

export const reviewRoutes = router;
