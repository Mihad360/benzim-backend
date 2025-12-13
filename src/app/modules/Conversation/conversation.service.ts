import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { ConversationModel } from "./conversation.model";
import { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";

const getMyConversation = async (user: JwtPayload) => {
  const userObjectId = new Types.ObjectId(user.user);

  let conversations;

  if (user.role === "user") {
    // USER: Conversation with Cooks
    conversations = await ConversationModel.find({
      userId: userObjectId,
      isDeleted: false,
    })
      .populate({
        path: "cookId",
        select: "name profileImage role isActive updatedAt",
      })
      .populate({
        path: "lastMsg",
        select: "msg createdAt sender_id", // customize if needed
      });

    if (!conversations || conversations.length === 0) {
      throw new AppError(HttpStatus.NOT_FOUND, "No conversations found");
    }

    return conversations;
  }

  if (user.role === "cook") {
    // COOK: Conversation with Users
    conversations = await ConversationModel.find({
      cookId: userObjectId,
      isDeleted: false,
    })
      .populate({
        path: "userId",
        select: "name profileImage role isActive updatedAt",
      })
      .populate({
        path: "lastMsg",
        select: "msg createdAt sender_id",
      });

    if (!conversations || conversations.length === 0) {
      throw new AppError(HttpStatus.NOT_FOUND, "No conversations found");
    }

    return conversations;
  }

  // INVALID ROLE
  throw new AppError(HttpStatus.FORBIDDEN, "Invalid user role");
};

const getEachConversation = async (id: string) => {
  const isConversationExist = await ConversationModel.findById(id)
    .populate({
      path: "cookId",
      select: "name profileImage role",
    })
    .populate({
      path: "userId",
      select: "name profileImage role",
    });

  if (!isConversationExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Conversation not exist");
  }
  return isConversationExist;
};

export const conversationServices = {
  getMyConversation,
  getEachConversation,
};
