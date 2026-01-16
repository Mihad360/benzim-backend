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

const getAllUsers = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await userServices.getAllUsers(user, req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "User profile retrieved successfully",
    meta: result.meta,
    data: result.result,
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
  // console.log(file);
  const result = await userServices.editUserProfile(id, file, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "User edit succesfully",
    data: result,
  });
});

const removeUser = catchAsync(async (req, res) => {
  const id = req.params.id;
  console.log(id);
  const result = await userServices.removeUser(id);

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
  getAllUsers,
  removeUser,
};
