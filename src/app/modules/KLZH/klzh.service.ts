import HttpStatus from "http-status";
import mongoose, { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { UserModel } from "../User/user.model";
import { KLZHFormData } from "./klzh.interface";
import KLZHModel from "./klzh.model";
import {
  generateKLZHRegistrationPDF,
  generateUniqueBusinessNumber,
  sendBusinessNumberEmail,
} from "./klzh.utils";
import AppError from "../../erros/AppError";

const registerKlzh = async (payload: KLZHFormData, user: JwtPayload) => {
  const userId = new Types.ObjectId(user.user);
  const isAlreadyKlzhExist = await KLZHModel.findOne({
    userId: userId,
    isDeleted: false,
  });
  if (isAlreadyKlzhExist) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "You have already registered a KLZH",
    );
  }

  const session = await mongoose.startSession(); // Start a Mongoose session
  session.startTransaction(); // Begin transaction

  try {
    const businessNumber = await generateUniqueBusinessNumber();
    payload.betriebsnummer = businessNumber;
    payload.userId = userId;
    // Step 1: Save KLZHFormData within the session
    const klzhData = await KLZHModel.create([payload], { session });

    await generateKLZHRegistrationPDF(klzhData[0], "ahmedmihad962@gmail.com");

    // Step 2: Update the user with the generated business number and expiration date (+7 days)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);

    const userUpdate = await UserModel.findByIdAndUpdate(
      userId,
      {
        // isKlzhRegistered: true,
        klzhNumber: businessNumber,
        klzhNumberExpiry: expirationDate,
      },
      { session }, // Pass the session to the update
    );

    if (!userUpdate) {
      await session.abortTransaction(); // Rollback transaction if user update fails
      throw new AppError(HttpStatus.BAD_REQUEST, "User update failed");
    }

    // Step 3: Send the generated business number to the user's email
    const emailSent = await sendBusinessNumberEmail(
      user.email as string,
      businessNumber,
    );
    if (!emailSent) {
      await session.abortTransaction();
      throw new AppError(HttpStatus.BAD_REQUEST, "Email sending failed");
    }

    await session.commitTransaction();

    return klzhData;
  } catch (error) {
    console.error("Error registering KLZH:", error);
    await session.abortTransaction(); // Ensure transaction is aborted on error
    throw new AppError(HttpStatus.BAD_REQUEST, "Something went wrong");
  } finally {
    session.endSession(); // End the session
  }
};

const verifyBusinessNumber = async (
  klzhId: string,
  user: JwtPayload,
  payload: { businessNumber: string },
) => {
  const isKlzhExist = await KLZHModel.findOne({
    _id: klzhId,
  });
  if (!isKlzhExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Klzh not found");
  }
  if (isKlzhExist.betriebsnummer !== payload.businessNumber) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "The business number is invalid",
    );
  }
  const userUpdate = await UserModel.findByIdAndUpdate(
    user.user,
    {
      isKlzhRegistered: true,
    },
    { new: true },
  );
  if (!userUpdate) {
    throw new AppError(HttpStatus.BAD_REQUEST, "user update failed");
  }
  return isKlzhExist;
};

export const klzhServices = {
  registerKlzh,
  verifyBusinessNumber,
};
