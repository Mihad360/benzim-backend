import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import ISelfResponsibilityContract from "./selfResponsibility.interface";
import SelfResponsibilityContract from "./selfResponsibility.model";
import { Types } from "mongoose";
import { UserModel } from "../User/user.model";
import { JwtPayload } from "../../interface/global";

const addSelfResRules = async (payload: ISelfResponsibilityContract) => {
  const contract = new SelfResponsibilityContract(payload);
  await contract.save();
  return contract;
};

const updateSelfResRules = async (
  contractId: Types.ObjectId | string,
  payload: Partial<ISelfResponsibilityContract>,
) => {
  try {
    const contract = await SelfResponsibilityContract.findById(contractId);
    if (!contract) {
      throw new Error("Contract not found");
    }

    // Handle descriptions update
    if (payload.descriptions) {
      // Replace the entire descriptions array
      contract.descriptions = payload.descriptions;
    }

    // Apply other updates (non-descriptions)
    for (const key of Object.keys(payload) as Array<
      keyof ISelfResponsibilityContract
    >) {
      if (key !== "descriptions" && payload[key] !== undefined) {
        // Use type assertion to avoid TypeScript errors
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (contract as any)[key] = payload[key];
      }
    }

    await contract.save();
    return contract;
  } catch (error) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Error updating contract: " + error,
    );
  }
};

const getSelfResContract = async () => {
  const result = await SelfResponsibilityContract.find({ isDeleted: false });
  return result;
};

const updateSelfResStatus = async (contractId: string, user: JwtPayload) => {
  const cookId = new Types.ObjectId(user.user);
  const isContractExist = await SelfResponsibilityContract.findById(contractId);
  if (!isContractExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Contract not found");
  }
  const result = await UserModel.findByIdAndUpdate(
    cookId,
    {
      isSelfResContract: true,
    },
    { new: true },
  );
  if (!result) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Agree failed");
  }
  return { message: "Self responsibility contract agreed successfully" };
};

export const selfResRuleServices = {
  addSelfResRules,
  updateSelfResRules,
  getSelfResContract,
  updateSelfResStatus,
};
