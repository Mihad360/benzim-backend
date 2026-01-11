import HttpStatus from "http-status";
import mongoose, { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { UserModel } from "../User/user.model";
import AppError from "../../erros/AppError";
import { sendFileToCloudinary } from "../../utils/sendImageToCloudinary";
import { sendEmail } from "../../utils/sendEmail";
import config from "../../config";
import { KLZHModel } from "./klzh.model";

const registerKlzh = async (file: Express.Multer.File, user: JwtPayload) => {
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

  if (!file) {
    throw new AppError(HttpStatus.BAD_REQUEST, "PDF file is required");
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const fileName = `${isUserKlzh?.name}.KLZH`;
    const fileInfo = await sendFileToCloudinary(
      file.buffer,
      fileName,
      file.mimetype,
    );
    const pdfUrl = fileInfo.secure_url;

    // Save KLZH data with PDF URL
    const klzhData = await KLZHModel.create(
      [
        {
          userId: userId,
          pdfUrl: pdfUrl,
        },
      ],
      { session },
    );

    // Update user
    const expirationDate = new Date();
    expirationDate.setDate(expirationDate.getDate() + 7);

    const userUpdate = await UserModel.findByIdAndUpdate(
      userId,
      {
        klzhNumberExpiry: expirationDate,
        pdfSent: true,
      },
      { session, new: true },
    );

    if (!userUpdate) {
      await session.abortTransaction();
      throw new AppError(HttpStatus.BAD_REQUEST, "User update failed");
    }

    // Send PDF email with attachment
    const emailSubject = "KLZH Registration - Your PDF Document";
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>KLZH Registration Successful</h2>
        <p>Dear ${isUserKlzh?.name},</p>
        <p>Your KLZH registration has been completed successfully.</p>
        <p>Please find your registration document attached to this email.</p>
        <p>You can also access your document at: <a href="${pdfUrl}">View Document</a></p>
        <br/>
        <p>Best regards,<br/>KLZH Team</p>
      </div>
    `;

    const emailAttachments = [
      {
        filename: `${fileName}.pdf`,
        path: pdfUrl, // Cloudinary URL
      },
    ];

    const emailSent = await sendEmail(
      config.klzh_email as string,
      emailSubject,
      emailHtml,
      emailAttachments,
    );

    if (!emailSent || !emailSent.success) {
      await session.abortTransaction();
      throw new AppError(HttpStatus.BAD_REQUEST, "Email sending failed");
    }

    await session.commitTransaction();

    return klzhData[0];
  } catch (error) {
    console.error("Error registering KLZH:", error);
    await session.abortTransaction();
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      error instanceof Error ? error.message : "Something went wrong",
    );
  } finally {
    session.endSession();
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
