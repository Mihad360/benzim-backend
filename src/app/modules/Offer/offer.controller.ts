import HttpStatus from "http-status";
import { JwtPayload } from "../../interface/global";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { offerServices } from "./offer.service";

const createAnOffer = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const file = req.file as Express.Multer.File;
  const result = await offerServices.createAnOffer(req.body, user, file);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: result,
  });
});

const getOffers = catchAsync(async (req, res) => {
  const result = await offerServices.getOffers(req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: result,
  });
});

const applyPromoCodeToOrder = catchAsync(async (req, res) => {
  const id = req.params.orderId;
  const result = await offerServices.applyPromoCodeToOrder(id, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: result,
  });
});

export const offerControllers = {
  createAnOffer,
  getOffers,
  applyPromoCodeToOrder,
};
