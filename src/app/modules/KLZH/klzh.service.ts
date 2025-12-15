import HttpStatus from "http-status";
import mongoose, { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { UserModel } from "../User/user.model";
import { KLZHFormData } from "./klzh.interface";
import KLZHModel from "./klzh.model";
import {
  generateKLZHRegistrationPDFs,
  generateUniqueBusinessNumber,
  sendBusinessNumberEmail,
  sendKlzhPdfEmail,
} from "./klzh.utils";
import AppError from "../../erros/AppError";

const registerKlzh = async (payload: KLZHFormData, user: JwtPayload) => {
  const userId = new Types.ObjectId(user.user);
  const isAlreadyKlzhExist = await KLZHModel.findOne({
    userId: userId,
    isDeleted: false,
  });
  const isUserKlzh = await UserModel.findById(userId);
  if (isAlreadyKlzhExist && isUserKlzh && isUserKlzh.isKlzhRegistered) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "You have already registered a KLZH",
    );
  }

  const session = await mongoose.startSession(); // Start a Mongoose session
  session.startTransaction(); // Begin transaction

  try {
    const businessNumber = await generateUniqueBusinessNumber();
    payload.userId = userId;
    // Step 1: Save KLZHFormData within the session
    const klzhData = await KLZHModel.create([payload], { session });
    // Step 2: Update the user with the generated business number and expiration date (+7 days)
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);

    const userUpdate = await UserModel.findByIdAndUpdate(
      userId,
      {
        klzhNumberExpiry: expirationDate,
        pdfSent: true,
      },
      { session },
    );

    if (!userUpdate) {
      await session.abortTransaction();
      throw new AppError(HttpStatus.BAD_REQUEST, "User update failed");
    }

    const pdfPath = await generateKLZHRegistrationPDFs(
      klzhData[0],
      "ahmedmihad962@gmail.com",
    );
    const pdfSent = await sendKlzhPdfEmail(user.email as string, pdfPath);
    if (!pdfSent) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Pdf sending failed");
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
  // klzhId: string,
  user: JwtPayload,
  payload: { businessNumber: string },
) => {
  const userId = new Types.ObjectId(user.user);
  // const isKlzhExist = await KLZHModel.findOne({
  //   _id: klzhId,
  // });
  // if (!isKlzhExist) {
  //   throw new AppError(HttpStatus.NOT_FOUND, "Klzh not found");
  // }
  // isKlzhExist.betriebsnummer = payload.businessNumber;
  // isKlzhExist.save();
  const userUpdate = await UserModel.findByIdAndUpdate(
    userId,
    {
      klzhNumber: payload.businessNumber,
      isKlzhRegistered: true,
      $inc: { trackStep: 1 },
    },
    { new: true },
  );
  if (!userUpdate) {
    throw new AppError(HttpStatus.BAD_REQUEST, "user update failed");
  }
  return { user: userUpdate };
};

export const klzhServices = {
  registerKlzh,
  verifyBusinessNumber,
};
