import { model, Schema } from "mongoose";
import { IOffer } from "./offer.interface";

const offerSchema = new Schema<IOffer>({
  cookId: { type: Schema.Types.ObjectId, ref: "Cook" },
  title: { type: String, required: true },
  image: { type: String },
  code: { type: String, required: true },

  offerScope: {
    type: String,
    enum: ["meal", "category", "delivery", "global"],
    required: true,
  },
  discountType: {
    type: String,
    enum: ["percentage", "flat"],
    default: "percentage",
  },
  discountValue: { type: Number, required: true },
  applicableMealIds: [{ type: Schema.Types.ObjectId, ref: "Meal" }],
  max: { type: Number },
  startDate: { type: Date },
  endDate: { type: Date },
  isActive: { type: Boolean, default: true },
  isDeleted: { type: Boolean, default: false },
});

const OfferModel = model<IOffer>("Offer", offerSchema);
export default OfferModel;
