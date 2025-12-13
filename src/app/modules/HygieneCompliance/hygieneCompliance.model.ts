import { model, Schema } from "mongoose";
import { IHygieneCompliance } from "./hygieneCompliance.interface";

const HygieneComplianceSchema = new Schema<IHygieneCompliance>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    documentTitle: {
      type: String,
    },
    documentUrl: {
      type: String,
    },
    pagesViewed: {
      type: Number,
      default: 0, // Tracks how many pages the user has seen
    },
    isAcknowledged: {
      type: Boolean,
      default: false, // Indicates whether the user acknowledged
    },
    acknowledgmentDate: {
      type: Date,
      default: null, // Date when the user acknowledged
    },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  },
);

const HygieneComplianceModel = model<IHygieneCompliance>(
  "HygieneCompliance",
  HygieneComplianceSchema,
);

export default HygieneComplianceModel;
