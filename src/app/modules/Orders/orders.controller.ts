import HttpStatus from "http-status";
import { JwtPayload } from "../../interface/global";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { orderServices } from "./orders.service";

const createOrder = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await orderServices.createOrder(req.body, user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: result,
  });
});

const addTip = catchAsync(async (req, res) => {
  const id = req.params.orderId;
  const result = await orderServices.addTip(id, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: result,
  });
});

const myCurrentOrders = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await orderServices.myCurrentOrders(user, req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset successfully",
    meta: result.meta,
    data: result.data,
  });
});

export const orderControllers = {
  createOrder,
  addTip,
  myCurrentOrders,
};
