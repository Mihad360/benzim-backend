import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { freelanceServices } from "./freelanceAggrement.service";

const addFreelanceAggrement = catchAsync(async (req, res) => {
  const result = await freelanceServices.addFreelanceAggrement(req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "OTP verified successfully",
    data: result,
  });
});

const updateFreelancerAgreement = catchAsync(async (req, res) => {
  const id = req.params.id;
  const result = await freelanceServices.updateFreelancerAgreement(
    id,
    req.body,
  );

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "OTP verified successfully",
    data: result,
  });
});

const getFreelance = catchAsync(async (req, res) => {
  const result = await freelanceServices.getFreelance();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "OTP verified successfully",
    data: result[0],
  });
});

export const freelanceControllers = {
  updateFreelancerAgreement,
  addFreelanceAggrement,
  getFreelance,
};
