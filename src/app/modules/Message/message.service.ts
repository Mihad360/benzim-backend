/* eslint-disable @typescript-eslint/no-explicit-any */
import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { JwtPayload } from "../../interface/global";
import { ConversationModel } from "../Conversation/conversation.model";
import { IMessage } from "./message.interface";
import mongoose from "mongoose";
import { MessageModel } from "./message.model";

const sendMessage = async (
  conversationId: string,
  user: JwtPayload,
  payload: IMessage,
) => {
  const userId = user.user; // Extract the user ID from the JWT token
  // Start a session for the transaction
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // Check if the conversation exists for the provided conversation ID and userId
    const conversation = await ConversationModel.findOne({
      _id: conversationId,
      $or: [
        { cookId: userId }, // Either the user is the teacher
        { userId: userId }, // Or the user is a participant in the conversation
      ],
    }).session(session); // Ensure session is used

    if (!conversation) {
      throw new AppError(
        HttpStatus.NOT_FOUND,
        "Conversation not found or user not authorized.",
      );
    }

    // Set the sender_id in the payload
    payload.sender_id = userId;
    payload.conversation_id = conversationId;

    // Create the message with session for transaction
    const result = await MessageModel.create([payload], { session });

    if (!result) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Message failed to send");
    }

    // Update the conversation with the last message ID
    const updatedConversation = await ConversationModel.findByIdAndUpdate(
      conversationId,
      { lastMsg: result[0]._id },
      { new: true, session },
    );

    if (!updatedConversation) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Something went wrong during conversation update",
      );
    }

    // Commit transaction after everything is done
    await session.commitTransaction();
    await session.endSession();

    return result[0]; // Return the first message from the result array
  } catch (error) {
    await session.abortTransaction();
    await session.endSession();
    throw new AppError(HttpStatus.BAD_REQUEST, error as any);
  }
};

export const messageServices = {
  sendMessage,
};
