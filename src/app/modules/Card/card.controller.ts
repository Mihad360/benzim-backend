import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { cardServices } from "./card.service";

const addPaymentCard = catchAsync(async (req, res) => {
  const user = req.user;
  const result = await cardServices.addPaymentCard(req.body, user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "account created successfully",
    data: result,
  });
});

export const cardControllers = {
  addPaymentCard,
};
