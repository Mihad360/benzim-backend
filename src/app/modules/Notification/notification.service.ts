import HttpStatus from "http-status";
import mongoose from "mongoose";
import { INotification } from "./notification.interface";
import AppError from "../../erros/AppError";
import { NotificationModel } from "./notification.model";

export const createAdminNotification = async (
  payload: INotification,
  session?: mongoose.ClientSession,
) => {
  try {
    if (!payload) {
      throw new AppError(HttpStatus.NOT_FOUND, "Response not found");
    }

    // Use session if provided
    const sendNot = await NotificationModel.create([payload], { session });

    if (!sendNot || sendNot.length === 0) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Notification create failed");
    }

    return sendNot[0];
  } catch (error) {
    console.error("Error creating notification:", error);
    throw new Error("Notification creation failed");
  }
};
