import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { verifyCookIdServices } from "./verifyCook.service";
import { JwtPayload } from "../../interface/global";
import AppError from "../../erros/AppError";

const addSelfResRules = catchAsync(async (req, res) => {
  const files = req.files as { [fieldname: string]: Express.Multer.File[] };
  const validIdImage = files["validIdImage"]?.[0];
  const selfieImage = files["selfieImage"]?.[0];

  // You can now process both images as needed, for example:
  if (!validIdImage || !selfieImage) {
    throw new AppError(HttpStatus.NOT_FOUND, "Files not found");
  }
  const body = {
    validIdImage: validIdImage,
    selfieImage: selfieImage,
  };
  const user = req.user as JwtPayload;
  const result = await verifyCookIdServices.verifyIdentity(
    user,
    req.body,
    body,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: result,
  });
});

const getVerificationCooks = catchAsync(async (req, res) => {
  const result = await verifyCookIdServices.getVerificationCooks(req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset successfully",
    meta: result.meta,
    data: result.result,
  });
});

export const verifyCookIdControllers = {
  addSelfResRules,
  getVerificationCooks,
};
