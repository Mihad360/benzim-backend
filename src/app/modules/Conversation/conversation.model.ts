import { Schema, model } from "mongoose";
import { IConversation } from "./conversation.interface";

const conversationSchema = new Schema<IConversation>(
  {
    cookId: { type: Schema.Types.ObjectId, ref: "User" },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    lastMsg: { type: Schema.Types.ObjectId, ref: "Message", default: null },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const ConversationModel = model<IConversation>(
  "Conversation",
  conversationSchema,
);
