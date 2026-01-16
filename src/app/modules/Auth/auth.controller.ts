import HttpStatus from "http-status";
import sendResponse from "../../utils/sendResponse";
import catchAsync from "../../utils/catchAsync";
import { authServices } from "./auth.service";
import { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";

const createAccount = catchAsync(async (req, res) => {
  const result = await authServices.createAccount(req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "account created successfully",
    data: result,
  });
});

const loginUser = catchAsync(async (req, res) => {
  const result = await authServices.loginUser(req.body);
  const { accessToken, refreshToken, role, user, onboardingUrl } = result;

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 365 * 60 * 60 * 14,
  });

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "none",
    maxAge: 365 * 60 * 60 * 60,
  });

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Logged in successfully",
    data: {
      role,
      accessToken,
      refreshToken,
      onboardingUrl,
      user,
    },
  });
});

const forgetPassword = catchAsync(async (req, res) => {
  const result = await authServices.forgetPassword(req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset email sent successfully",
    data: result,
  });
});

const verifyOtp = catchAsync(async (req, res) => {
  const result = await authServices.verifyOtp(req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "OTP verified successfully",
    data: result,
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await authServices.resetPassword(req.body, user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: result,
  });
});

const changePassword = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const userId = new Types.ObjectId(user.user);
  const result = await authServices.changePassword(userId, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password changed successfully",
    data: result,
  });
});

const resendOtp = catchAsync(async (req, res) => {
  const email = req.params.email;
  const result = await authServices.resendOtp(email);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset email sent successfully",
    data: result,
  });
});

const getUsers = catchAsync(async (req, res) => {
  const result = await authServices.getUsers();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset email sent successfully",
    data: result,
  });
});

// const deleteUser = catchAsync(async (req, res) => {
//   const email = req.params.email;
//   const result = await authServices.deleteUser(email);

//   sendResponse(res, {
//     statusCode: HttpStatus.OK,
//     success: true,
//     message: "Password reset email sent successfully",
//     data: result,
//   });
// });

const createStripeDashboard = catchAsync(async (req, res) => {
  const id = req.params.userId;
  const result = await authServices.createStripeDashboard(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset email sent successfully",
    data: result,
  });
});

export const authControllers = {
  createAccount,
  loginUser,
  forgetPassword,
  resetPassword,
  changePassword,
  verifyOtp,
  resendOtp,
  // deleteUser,
  getUsers,
  createStripeDashboard,
};
