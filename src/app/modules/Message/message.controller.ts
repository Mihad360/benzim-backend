import HttpStatus from "http-status";
import { JwtPayload } from "../../interface/global";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { messageServices } from "./message.service";

const sendMessage = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const id = req.params.conversationId;
  const result = await messageServices.sendMessage(id, user, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: result,
  });
});

const getAllMessage = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const id = req.params.conversationId;
  const result = await messageServices.getAllMessage(id, user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: result,
  });
});

export const messageControllers = {
  sendMessage,
  getAllMessage,
};
