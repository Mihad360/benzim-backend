import HttpStatus from "http-status";
import { JwtPayload } from "../../interface/global";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { klzhServices } from "./klzh.service";

const registerKlzh = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await klzhServices.registerKlzh(req.body, user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: result,
  });
});

const verifyBusinessNumber = catchAsync(async (req, res) => {
  const id = req.params.klzhId;
  const user = req.user as JwtPayload;
  const result = await klzhServices.verifyBusinessNumber(user, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: result,
  });
});

export const klzhControllers = {
  registerKlzh,
  verifyBusinessNumber,
};
