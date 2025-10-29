import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { selfResRuleServices } from "./selfResponsibility.service";
import { JwtPayload } from "../../interface/global";

const addSelfResRules = catchAsync(async (req, res) => {
  const result = await selfResRuleServices.addSelfResRules(req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: result,
  });
});

const updateSelfResRules = catchAsync(async (req, res) => {
  const id = req.params.contractId;
  const result = await selfResRuleServices.updateSelfResRules(id, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: result,
  });
});

const getSelfResContract = catchAsync(async (req, res) => {
  const result = await selfResRuleServices.getSelfResContract();

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: result,
  });
});

const updateSelfResStatus = catchAsync(async (req, res) => {
  const id = req.params.contractId;
  const user = req.user as JwtPayload;
  const result = await selfResRuleServices.updateSelfResStatus(id, user);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "Password reset successfully",
    data: result,
  });
});

export const selfResRuleControllers = {
  addSelfResRules,
  updateSelfResRules,
  getSelfResContract,
  updateSelfResStatus,
};
