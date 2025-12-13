import { Types } from "mongoose";

export interface IConversation {
  _id?: Types.ObjectId;
  cookId: Types.ObjectId;
  userId: Types.ObjectId;
  lastMsg?: Types.ObjectId;
  isDeleted: boolean;
}
