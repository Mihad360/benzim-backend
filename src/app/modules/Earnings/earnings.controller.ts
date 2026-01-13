import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { earningServices } from "./earnings.service";

const getEarnings = catchAsync(async (req, res) => {
  const result = await earningServices.getEarnings(req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "account created successfully",
    meta: result.meta,
    data: result.result,
  });
});

export const earningControllers = {
  getEarnings,
};
