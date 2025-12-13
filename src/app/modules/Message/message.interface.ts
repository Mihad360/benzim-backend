import { Types } from "mongoose";

export interface IMessage {
  conversation_id: Types.ObjectId | string;
  sender_id: Types.ObjectId | string;
  msg?: string;
  is_read?: boolean;
  isDeleted: boolean;
}
