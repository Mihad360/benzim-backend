import HttpStatus from "http-status";
import { Types } from "mongoose";
import FreelancerAgreementModel from "./freelanceAggrement.model";
import { IFreelancerAgreement } from "./freelanceAggrement.interface";
import AppError from "../../erros/AppError";

const addFreelanceAggrement = async (payload: IFreelancerAgreement) => {
  const count = await FreelancerAgreementModel.countDocuments({
    isDeleted: false, // Make sure it's not marked as deleted
  });
  if (count > 0) {
    // If count > 0, it means an agreement already exists for this provider
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "A freelancer agreement already exists for this provider.",
    );
  }
  const result = await FreelancerAgreementModel.create(payload);
  return result;
};

const updateFreelancerAgreement = async (
  agreementId: Types.ObjectId | string,
  payload: Partial<IFreelancerAgreement>, // Accepts any partial fields of IFreelancerAgreement
) => {
  try {
    // Prepare the update object by iterating over the payload
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateObj: any = {};

    // Iterate over the payload using Object.entries()
    Object.entries(payload).forEach(([key, value]) => {
      // Ensure key exists in the model and is not undefined
      if (value !== undefined) {
        updateObj[key] = value; // Dynamically set the key-value pair for the update
      }
    });

    // Find the agreement by ID and update the specific fields
    const updatedAgreement = await FreelancerAgreementModel.findByIdAndUpdate(
      agreementId, // Ensure the agreement is not deleted
      { $set: updateObj }, // Use the dynamic update object
      { new: true }, // Return the updated document
    );

    if (!updatedAgreement) {
      throw new Error("Agreement not found or already deleted");
    }

    return updatedAgreement;
  } catch (error) {
    console.error("Error updating freelancer agreement:", error);
    throw error;
  }
};

const getFreelance = async () => {
  const result = await FreelancerAgreementModel.find({ isDeleted: false });
  return result;
};

export const freelanceServices = {
  updateFreelancerAgreement,
  addFreelanceAggrement,
  getFreelance,
};
