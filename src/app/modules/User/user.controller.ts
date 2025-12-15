import HttpStatus from "http-status";
import { JwtPayload } from "../../interface/global";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { userServices } from "./user.service";

const getMe = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await userServices.getMe(user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "User profile retrieved successfully",
    data: result,
  });
});

const trackPagesUpdate = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await userServices.trackPagesUpdate(user, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "User profile retrieved successfully",
    data: result,
  });
});

const editUserProfile = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const id = user.user as string;
  const file = req.file as Express.Multer.File;
  const result = await userServices.editUserProfile(id, file, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "User edit succesfully",
    data: result,
  });
});

export const userControllers = {
  editUserProfile,
  getMe,
  trackPagesUpdate,
};
