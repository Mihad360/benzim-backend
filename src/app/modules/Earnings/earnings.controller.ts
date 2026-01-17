import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { earningServices } from "./earnings.service";
import { JwtPayload } from "../../interface/global";

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

const getDashboardStats = catchAsync(async (req, res) => {
  const year = Number(req.query.year);
  const result = await earningServices.getDashboardStats(year);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "account created successfully",
    data: result,
  });
});

const getMyEarnings = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await earningServices.getMyEarnings(user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "account created successfully",
    data: result,
  });
});

export const earningControllers = {
  getEarnings,
  getDashboardStats,
  getMyEarnings,
};
