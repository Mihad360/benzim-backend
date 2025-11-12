import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { JwtPayload } from "../../interface/global";
import { IReview } from "./review.interface";
import { ReviewModel } from "./review.model";
import { CookProfileModel } from "../Cook/cook.model";

export const giveReview = async (user: JwtPayload, payload: IReview) => {
  const { rating, comment, cookId } = payload;

  // 🧩 Validate cookId
  if (!cookId) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Cook ID is required");
  }

  // 🧱 Check if cook exists
  const cookExists = await CookProfileModel.findById(cookId);
  if (!cookExists) {
    throw new AppError(HttpStatus.NOT_FOUND, "Cook not found");
  }

  // 🚫 Prevent duplicate review from same user
  const existingReview = await ReviewModel.findOne({
    userId: user.user,
    cookId,
  });
  if (existingReview) {
    throw new AppError(
      HttpStatus.CONFLICT,
      "You have already reviewed this cook",
    );
  }

  // ✅ Create new review
  const review = await ReviewModel.create({
    userId: user.user,
    cookId,
    rating,
    comment,
  });

  // 🌟 Recalculate and update cook's average rating
  const cookReviews = await ReviewModel.find({ cookId });
  const avgRating =
    cookReviews.reduce((sum, r) => sum + r.rating, 0) / cookReviews.length;

  await CookProfileModel.findByIdAndUpdate(cookId, {
    rating: avgRating,
  });

  return review;
};

export const reviewServices = {
  giveReview,
};
