import { Schema, model } from "mongoose";
import ISelfResponsibilityContract from "./selfResponsibility.interface";

const selfResponsibilityContractSchema =
  new Schema<ISelfResponsibilityContract>(
    {
      title: {
        type: String,
        required: true,
      },
      noticeLine: {
        type: String,
        required: true,
      },
      descriptions: [
        {
          type: String,
          required: true,
        },
      ],
      isDeleted: { type: Boolean, default: false },
    },
    { timestamps: true },
  );

const SelfResponsibilityContract = model<ISelfResponsibilityContract>(
  "SelfResponsibilityContract",
  selfResponsibilityContractSchema,
);

export default SelfResponsibilityContract;
