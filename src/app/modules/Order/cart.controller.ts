import HttpStatus from "http-status";
import { JwtPayload } from "../../interface/global";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { cartServices } from "./cart.service";

const addToCartMeal = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const id = req.params.mealId;
  const result = await cartServices.addToCartMeal(id, req.body, user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: result,
  });
});

const excludeAoRder = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const id = req.params.cartId;
  const result = await cartServices.excludeAoRder(id, user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: result,
  });
});

const getOrders = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await cartServices.getOrders(user, req.query);
  
  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Orders retrieved successfully",
    meta: result.meta,
    quantities: result.quantities,
    totalPrice: result.totalPrice,
    data: result.result,
  });
});

const removeOrder = catchAsync(async (req, res) => {
  const id = req.params.orderId;
  const result = await cartServices.removeOrder(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: result,
  });
});

export const cartControllers = {
  addToCartMeal,
  getOrders,
  removeOrder,
  excludeAoRder,
};
