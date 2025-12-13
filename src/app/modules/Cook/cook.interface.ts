import { Types } from "mongoose";

export interface ICookProfile {
  _id?: Types.ObjectId;
  userId: Types.ObjectId; // Referencing the User model (ObjectId)
  cookName: string; // Name of the cook
  businessNumber: string; // Business phone number
  description: string; // Description of the cook profile
  shortDescription: string; // Short description of the cook
  location: string; // Location of the cook
  profileImage: string; // URL to the cook's profile image
  kitchenImages: string[]; // Array of URLs to the kitchen images
  certificates: string[]; // Array of URLs to the kitchen images
  approvedAt: Date | null; // Date when the cook was approved (null if not approved)
  rejectionReason: string | null; // Reason for rejection (null if not rejected)
  totalOrders: string; // Total orders handled
  completedOrders: string; // Total orders completed
  rejectedOrders: string; // Total orders rejected
  rating: number; // Rating based on feedback
  stars: string; // Star rating value
  totalReviews: string; // Total number of reviews
  isKlzhRegistered: boolean;
  isCookApproved: boolean;
  isDeleted?: boolean;
}

export interface IAvailabilitySchedule {
  day: string; // e.g., "Monday"
  status: "Open" | "Closed"; // "Open" or "Closed"
  from: string | null; // Opening time (e.g., "09:00 AM") or null if closed
  to: string | null; // Closing time (e.g., "05:00 PM") or null if closed
}

export interface ICookAvailability {
  cookId: Types.ObjectId; // Reference to the cook (User model)
  serviceType: "Delivery" | "Pick Up" | "Dine in"; // Type of service
  schedule: IAvailabilitySchedule[]; // Array of schedule objects for each day
}
