/* eslint-disable @typescript-eslint/no-explicit-any */
import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { JwtPayload } from "../../interface/global";
import { IReview } from "./review.interface";
import { ReviewModel } from "./review.model";
import { CookProfileModel } from "../Cook/cook.model";
import { UserModel } from "../User/user.model";

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

  await CookProfileModel.findByIdAndUpdate(
    cookId,
    {
      rating: avgRating,
    },
    { new: true },
  );

  return review;
};

const getMyReviews = async (user: JwtPayload) => {
  // 1️⃣ Get the user to check if they are a cook or a normal user
  const userData = await UserModel.findById(user.user)
    .select("cookId name profileImage")
    .lean();

  if (!userData) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  // If the user is a cook → fetch reviews for their cook profile
  const filter: any = {
    isDeleted: false,
  };

  if (userData.cookId) {
    filter.cookId = userData.cookId; // reviews about *this cook*
  } else {
    filter.userId = user.user; // reviews written by this user
  }

  // 2️⃣ Find reviews
  const reviews = await ReviewModel.find(filter)
    .populate({
      path: "userId",
      select: "name profileImage",
    })
    .populate({
      path: "cookId",
      select: "cookName profileImage",
    })
    .populate({
      path: "mealId",
      select: "title image",
    })
    .sort({ createdAt: -1 })
    .lean();

  // 3️⃣ Format tags based on comment content (simple keyword tagging)
  const keywordTags = [
    { key: "good taste", label: "Good taste" },
    { key: "nice packing", label: "Nice packing" },
    { key: "fresh", label: "Fresh" },
  ];

  const formattedReviews = reviews.map((review: any) => {
    const lowerComment = review.comment?.toLowerCase() || "";

    const tags = keywordTags
      .filter((t) => lowerComment.includes(t.key))
      .map((t) => t.label);

    return {
      _id: review._id,
      rating: review.rating,
      comment: review.comment,
      createdAt: review.createdAt,

      // opponent (reviewer)
      user: review.userId
        ? {
            name: review.userId.name,
            profileImage: review.userId.profileImage,
          }
        : null,

      // cook data (if review is for a cook)
      cook: review.cookId
        ? {
            name: review.cookId.cookName,
            profileImage: review.cookId.profileImage,
          }
        : null,

      // meal data (if review is for a meal)
      meal: review.mealId
        ? {
            title: review.mealId.mealName,
            image: review.mealId.images[0],
          }
        : null,

      tags,
    };
  });

  return formattedReviews;
};

export const reviewServices = {
  giveReview,
  getMyReviews,
};
