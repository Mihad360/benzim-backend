import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { courseServices } from "./course.service";
import { JwtPayload } from "../../interface/global";

const addCourse = catchAsync(async (req, res) => {
  const files = req.files as Express.Multer.File[];
  const result = await courseServices.addCourse(files, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: result,
  });
});

const getCourses = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await courseServices.getCourses(user, req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset successfully",
    meta: result.meta,
    data: result.result,
  });
});

const addQuizes = catchAsync(async (req, res) => {
  const result = await courseServices.addQuizes(req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: result,
  });
});

export const courseControllers = {
  addCourse,
  getCourses,
  addQuizes,
};
