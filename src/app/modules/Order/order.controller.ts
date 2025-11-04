import HttpStatus from "http-status";
import { JwtPayload } from "../../interface/global";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { orderServices } from "./order.service";

const orderMeal = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const id = req.params.mealId;
  const result = await orderServices.orderMeal(id, req.body, user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: result,
  });
});

const excludeAoRder = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const id = req.params.mealId;
  const result = await orderServices.excludeAoRder(id, user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: result,
  });
});

const getOrders = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await orderServices.getOrders(user, req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset successfully",
    meta: result.meta,
    data: result.result,
  });
});

const updateOrderStatus = catchAsync(async (req, res) => {
  const id = req.params.orderId;
  const result = await orderServices.updateOrderStatus(id, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: result,
  });
});

const removeOrder = catchAsync(async (req, res) => {
  const id = req.params.orderId;
  const result = await orderServices.removeOrder(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: result,
  });
});

export const orderControllers = {
  orderMeal,
  getOrders,
  updateOrderStatus,
  removeOrder,
  excludeAoRder,
};
