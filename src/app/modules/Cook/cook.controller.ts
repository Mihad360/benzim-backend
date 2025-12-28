/* eslint-disable @typescript-eslint/no-explicit-any */
import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { cookServices } from "./cook.service";
import { JwtPayload } from "../../interface/global";

export interface IFileFields {
  profileImage: Express.Multer.File[]; // Single file
  kitchenImages: Express.Multer.File[]; // Multiple files
  certificates: Express.Multer.File[]; // Multiple files
}

const becomeACook = catchAsync(async (req, res) => {
  const files = req.files as any;
  const user = req.user as JwtPayload;
  const result = await cookServices.becomeACook(req.body, user, files);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "OTP verified successfully",
    data: result,
  });
});

const setAvailability = catchAsync(async (req, res) => {
  const id = req.params.cookId;
  const result = await cookServices.setAvailability(id, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "OTP verified successfully",
    data: result,
  });
});

const getCookProfile = catchAsync(async (req, res) => {
  const result = await cookServices.getCookProfile(req.user as JwtPayload);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "OTP verified successfully",
    data: result,
  });
});

const cooksLocation = catchAsync(async (req, res) => {
  const result = await cookServices.cooksLocation(
    // req.body,
    req.query,
    // req.user as JwtPayload,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "OTP verified successfully",
    meta: result.meta,
    data: result.result,
  });
});

const getEachCook = catchAsync(async (req, res) => {
  const id = req.params.cookId;
  const result = await cookServices.getEachCook(id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "OTP verified successfully",
    data: result,
  });
});

export const cookControllers = {
  becomeACook,
  setAvailability,
  getCookProfile,
  cooksLocation,
  getEachCook,
};
