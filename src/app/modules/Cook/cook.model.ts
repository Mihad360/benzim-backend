import mongoose, { model, Schema } from "mongoose";
import {
  IAvailabilitySchedule,
  ICookAvailability,
  ICookProfile,
} from "./cook.interface";

const CookProfileSchema = new Schema<ICookProfile>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    cookName: {
      type: String,
      default: null,
    },
    businessNumber: {
      type: String,
    },
    description: {
      type: String,
    },
    shortDescription: {
      type: String,
    },
    location: {
      type: String,
    },
    profileImage: {
      type: String,
    },
    kitchenImages: {
      type: [String],
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    totalOrders: {
      type: String,
      default: "0",
    },
    completedOrders: {
      type: String,
      default: "0",
    },
    rejectedOrders: {
      type: String,
      default: "0",
    },
    rating: {
      type: Number,
      default: 0,
    },
    stars: {
      type: String,
      default: "0",
    },
    totalReviews: {
      type: String,
      default: "0",
    },
    // New field added to the schema
    isKlzhRegistered: {
      type: Boolean,
      default: false, // Default is false (assuming cooks are not registered by default)
    },
    isCookApproved: {
      type: Boolean,
      default: false, // Default is false (assuming cooks are not registered by default)
    },
    isDeleted: { type: Boolean, default: false },
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt fields
  },
);

export const CookProfileModel = mongoose.model<ICookProfile>(
  "Cook",
  CookProfileSchema,
);

const availabilityScheduleSchema = new Schema<IAvailabilitySchedule>({
  day: { type: String, required: true },
  status: { type: String, enum: ["Open", "Closed"], required: true },
  from: { type: String, default: null },
  to: { type: String, default: null },
});

const cookAvailabilitySchema = new Schema<ICookAvailability>({
  cookId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  serviceType: {
    type: String,
    enum: ["Delivery", "Pick Up", "Dine in"],
  },
  schedule: { type: [availabilityScheduleSchema], required: true },
});

// Create the Mongoose model based on the schema
export const CookAvailabilityModel = model<ICookAvailability>(
  "CookAvailability",
  cookAvailabilitySchema,
);
