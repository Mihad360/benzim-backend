import { Schema, model } from "mongoose";
import { IFreelancerAgreement } from "./freelanceAggrement.interface";

// Simple Freelancer Agreement Schema
const freelancerAgreementSchema = new Schema<IFreelancerAgreement>(
  {
    terms: {
      type: [String], // Array of terms that the provider agrees to
      required: true,
      default: [
        "Provider is fully responsible for product safety",
        "Provider is liable for any issues",
        "Provider ensures legal compliance",
        "Provider manages hygiene and safety",
      ],
    },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const FreelancerAgreementModel = model<IFreelancerAgreement>(
  "FreelancerAgreement",
  freelancerAgreementSchema,
);

export default FreelancerAgreementModel;
