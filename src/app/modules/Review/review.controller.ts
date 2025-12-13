import HttpStatus from "http-status";
import { JwtPayload } from "../../interface/global";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { reviewServices } from "./review.service";

const giveReview = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await reviewServices.giveReview(user, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: result,
  });
});

const getMyReviews = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await reviewServices.getMyReviews(user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: result,
  });
});

export const reviewControllers = {
  giveReview,
  getMyReviews,
};
