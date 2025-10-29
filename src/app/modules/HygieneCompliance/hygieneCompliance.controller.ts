import HttpStatus from "http-status";
import { JwtPayload } from "../../interface/global";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { hygieneServices } from "./hygieneCompliance.service";

const uploadHygieneFile = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const files = req.files as Express.Multer.File[];
  const result = await hygieneServices.uploadHygieneFile(files, user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: result,
  });
});

const getHygieneCompliances = catchAsync(async (req, res) => {
  const result = await hygieneServices.getHygieneCompliances();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: result,
  });
});

export const hygieneControllers = {
  uploadHygieneFile,
  getHygieneCompliances,
};
