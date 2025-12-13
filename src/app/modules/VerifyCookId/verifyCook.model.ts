import { model, Schema } from "mongoose";
import { IVerifyCookId } from "./verifyCook.interface";

const verifyCookIdSchema = new Schema<IVerifyCookId>(
  {
    cookId: { type: Schema.Types.ObjectId, ref: "Cook" },
    ownerName: { type: String, required: true },
    businessNumber: { type: String, required: true },
    validIdType: {
      type: String,
      enum: ["passport", "nationalId"],
      required: true,
    },
    validIdUrl: { type: String, required: true },
    selfIdType: {
      type: String,
      enum: ["selfie", "video"],
      required: true,
    },
    selfIdUrl: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }, // Adds createdAt and updatedAt fields
);

// Create the Mongoose model
const VerifyCookIdModel = model<IVerifyCookId>("VerifyCookId", verifyCookIdSchema);

export default VerifyCookIdModel;
