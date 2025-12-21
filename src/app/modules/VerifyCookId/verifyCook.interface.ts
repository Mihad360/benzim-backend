import { Types } from "mongoose";

export interface IVerifyCookId {
  cookId: Types.ObjectId;
  ownerName?: string;
  businessNumber: string;
  validIdType: "passport" | "nationalId";
  validIdUrl: string;
  selfIdType?: "selfie" | "video";
  selfIdUrl?: string;
  // status: "pending" | "approved" | "rejected";
  isDeleted: boolean;
}
