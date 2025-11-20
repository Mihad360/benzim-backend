import HttpStatus from "http-status";
import { JwtPayload } from "../../interface/global";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { mealServices } from "./meal.service";

const addMeal = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const files = req.files as Express.Multer.File[];
  const result = await mealServices.addMeal(req.body, user, files);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: result,
  });
});

const getMyMeals = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await mealServices.getMyMeals(user, req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset successfully",
    meta: result.meta,
    data: result,
  });
});

export const mealControllers = {
  addMeal,
  getMyMeals,
};
