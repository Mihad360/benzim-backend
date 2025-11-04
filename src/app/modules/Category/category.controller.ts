import HttpStatus from "http-status";
import { JwtPayload } from "../../interface/global";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { categoryServices } from "./category.service";

const addCategory = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await categoryServices.addCategory(req.body, user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "OTP verified successfully",
    data: result,
  });
});

const getCategories = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await categoryServices.getCategories(user, req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset successfully",
    meta: result.meta,
    data: result.result,
  });
});

export const categoryControllers = {
  addCategory,
  getCategories,
};
