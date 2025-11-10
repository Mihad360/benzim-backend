import { Schema, model } from "mongoose";
import { IMessage } from "./message.interface";

// The message schema where sender_id and receiver_id can reference User or Participant
const messageSchema = new Schema<IMessage>(
  {
    conversation_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Conversation", // Dynamically decide the reference model
    },
    sender_id: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "User", // Dynamically decide the reference model
    },
    msg: {
      type: String,
    },
    is_read: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const MessageModel = model<IMessage>("Message", messageSchema);
