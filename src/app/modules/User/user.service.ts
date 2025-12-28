/* eslint-disable @typescript-eslint/no-explicit-any */
import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { ITrackPayload, IUser } from "./user.interface";
import { UserModel } from "./user.model";
import { sendFileToCloudinary } from "../../utils/sendImageToCloudinary";
import { JwtPayload } from "../../interface/global";
import mongoose, { Types } from "mongoose";
import QueryBuilder from "../../builder/QueryBuilder";
import { CookProfileModel } from "../Cook/cook.model";

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
  // ================================
  // 1️⃣ Start MongoDB Session
  // ================================
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Find user
    const user = await UserModel.findById(id).session(session);
    if (!user) {
      throw new AppError(HttpStatus.NOT_FOUND, "User not found");
    }

    if (user.isDeleted) {
      throw new AppError(HttpStatus.FORBIDDEN, "User is blocked");
    }

    if (payload.email) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Email cannot be updated");
    }

    const updateData: Partial<IUser> = {};

    // ================================
    // 2️⃣ Upload Image if Provided
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
    // 3️⃣ Update Editable Fields
    // ================================
    if (payload.name) updateData.name = payload.name;
    if (payload.phoneNumber) updateData.phoneNumber = payload.phoneNumber;

    // ================================
    // 4️⃣ Update User in MongoDB
    // ================================
    const updatedUser = await UserModel.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, session }, // ← Add session here
    ).select("-password -otp -expiresAt -passwordChangedAt");

    if (!updatedUser) {
      throw new AppError(HttpStatus.BAD_REQUEST, "User update failed");
    }

    // ================================
    // 5️⃣ Update Cook Profile if User is a Cook
    // ================================
    if (updatedUser.role === "cook" && updatedUser.cookId) {
      const updateCook = await CookProfileModel.findByIdAndUpdate(
        updatedUser.cookId,
        { cookName: updatedUser.name },
        { new: true, session }, // ← Add session here
      );

      if (!updateCook) {
        throw new AppError(HttpStatus.BAD_REQUEST, "Cook update failed");
      }
    }

    // ================================
    // 6️⃣ Commit Transaction
    // ================================
    await session.commitTransaction();
    session.endSession();

    return updatedUser;
  } catch (error) {
    // ================================
    // 7️⃣ Rollback on Error
    // ================================
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const trackPagesUpdate = async (
  user: JwtPayload,
  payload: ITrackPayload,
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const userId = new Types.ObjectId(user.user);

    const existingUser = await UserModel.findById(userId).session(session);
    if (!existingUser) {
      throw new AppError(HttpStatus.NOT_FOUND, "User not found");
    }

    const trackStep = Number(existingUser.trackStep);

    const updateData: Record<string, any> = {
      $inc: { trackStep: 1 },
    };

    // 🔴 Hygiene validation
    if (payload.type === "hygiene") {
      if (existingUser.isHygiened && trackStep === 3) {
        throw new AppError(HttpStatus.BAD_REQUEST, "Hygiene already completed");
      }

      updateData.$set = { isHygiened: true };
    }

    // 🔴 Self-res contract validation
    if (payload.type === "selfres") {
      if (existingUser.isSelfResContract) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          "Self-res contract already completed",
        );
      }

      updateData.$set = { isSelfResContract: true };
    }

    if (payload.type === "course-video") {
      if (existingUser.isCookVideo) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          "Self-res contract already completed",
        );
      }

      updateData.$set = { isCookVideo: true };
    }

    if (payload.type === "course-pdf") {
      if (existingUser.isCookPdf) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          "Self-res contract already completed",
        );
      }

      updateData.$set = { isCookPdf: true };
    }

    if (payload.type === "course-quiz") {
      if (existingUser.isCookQuiz) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          "Self-res contract already completed",
        );
      }

      updateData.$set = { isCookQuiz: true, isCookfullyVerified: true };
    }

    const updatedUser = await UserModel.findByIdAndUpdate(userId, updateData, {
      new: true,
      session,
    });

    await session.commitTransaction();
    session.endSession();

    return updatedUser;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
};

export const userSearch = ["name", "email", "phoneNumber", "klzhNumber"];

const getAllUsers = async (
  user: JwtPayload,
  query: Record<string, unknown>,
) => {
  const userId = new Types.ObjectId(user.user);
  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user is not exist");
  }
  const usersQuery = new QueryBuilder(
    UserModel.find({ isDeleted: false }).sort({ createdAt: -1 }),
    query,
  )
    .search(userSearch)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await usersQuery.countTotal();
  const result = await usersQuery.modelQuery;
  return { meta, result };
};

const removeUser = async (id: string) => {
  const isUserExist = await UserModel.findById(id);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }
  const result = await UserModel.findByIdAndUpdate(
    isUserExist._id,
    {
      isDeleted: true,
    },
    { new: true },
  );
  return result;
};

export const userServices = {
  editUserProfile,
  getMe,
  trackPagesUpdate,
  getAllUsers,
  removeUser,
};
