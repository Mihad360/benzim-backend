import HttpStatus from "http-status";
import { ClientSession } from "mongoose";
import { INotification } from "./notification.interface";
import AppError from "../../erros/AppError";
import { NotificationModel } from "./notification.model";

export const createNotification = async (
  payload: INotification,
  session?: ClientSession, // Typing session with Mongoose ClientSession
) => {
  try {
    if (!payload) {
      throw new AppError(HttpStatus.NOT_FOUND, "Response not found");
    }

    // Create notification with session to ensure it's part of the transaction
    const sendNot = await NotificationModel.create([payload], { session });

    if (!sendNot) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Notification creation failed",
      );
    }

    return sendNot[0];
  } catch (error) {
    console.error("Error creating notification:", error);
    throw new Error("Notification creation failed");
  }
};
