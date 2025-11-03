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

export const categoryControllers = {
  addCategory,
};
