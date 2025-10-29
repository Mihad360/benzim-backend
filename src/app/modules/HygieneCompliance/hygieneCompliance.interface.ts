import { Types } from "mongoose";

export interface IHygieneCompliance {
  userId?: Types.ObjectId; // The user who acknowledged the document
  documentTitle?: string; // Title of the document, e.g., "Hygiene Compliance"
  documentUrl?: string; // URL or path to the stored PDF in Cloud Storage
  pagesViewed?: number; // Number of pages viewed by the user
  isAcknowledged?: boolean; // Whether the user has confirmed reading and understanding
  acknowledgmentDate?: Date; // When the user acknowledged
  isDeleted: boolean;
}
