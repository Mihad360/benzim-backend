import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { IUser } from "./user.interface";
import { UserModel } from "./user.model";
import { sendFileToCloudinary } from "../../utils/sendImageToCloudinary";
import { JwtPayload } from "../../interface/global";
import { Types } from "mongoose";

const getMe = async (user: JwtPayload) => {
  const userId = new Types.ObjectId(user.user);
  const isUserExist = await UserModel.findById(userId).select("-password");

  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user does not exist");
  }

  if (isUserExist.isDeleted) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user is blocked");
  }

  return isUserExist;
};

const editUserProfile = async (
  id: string,
  file: Express.Multer.File,
  payload: Partial<IUser>,
) => {
  // Find user
  const user = await UserModel.findById(id);
  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  if (user.isDeleted) {
    throw new AppError(HttpStatus.FORBIDDEN, "User is blocked");
  }

  const updateData: Partial<IUser> = {};

  // ================================
  // 1️⃣ Upload Image if Provided
  // ================================
  if (file) {
    const imageName = payload.name || "profile";
    const imageInfo = await sendFileToCloudinary(
      file.buffer,
      imageName,
      file.mimetype,
    );
    updateData.profileImage = imageInfo.secure_url;
  }

  // ================================
  // 2️⃣ Update Editable Fields
  // ================================
  if (payload.name) updateData.name = payload.name;
  if (payload.phoneNumber) updateData.phoneNumber = payload.phoneNumber;

  // ================================
  // 3️⃣ Email Update (separate logic)
  // ================================
  if (payload.email) {
    updateData.email = payload.email;
  }

  // ================================
  // 4️⃣ Update User in MongoDB
  // ================================
  const updatedUser = await UserModel.findByIdAndUpdate(
    id,
    { $set: updateData },
    { new: true },
  ).select("-password -otp -expiresAt -passwordChangedAt");

  return updatedUser;
};

export const userServices = {
  editUserProfile,
  getMe,
};
