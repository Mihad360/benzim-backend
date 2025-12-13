import HttpStatus from "http-status";
import { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { IVerifyCookId } from "./verifyCook.interface";
import { UserModel } from "../User/user.model";
import AppError from "../../erros/AppError";
import { CookProfileModel } from "../Cook/cook.model";
import { sendFileToCloudinary } from "../../utils/sendImageToCloudinary";
import VerifyCookIdModel from "./verifyCook.model";

const verifyIdentity = async (
  user: JwtPayload,
  payload: IVerifyCookId,
  files: {
    validIdImage: Express.Multer.File;
    selfieImage: Express.Multer.File;
  },
) => {
  const userId = new Types.ObjectId(user.user);
  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }
  const isCookExist = await CookProfileModel.findOne({
    userId: isUserExist._id,
  });
  if (!isCookExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Cook not found");
  }
  const isCookAlreadyVerified = await VerifyCookIdModel.findOne({
    cookId: isCookExist._id,
  });
  if (isCookAlreadyVerified) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "You are already verified & exist",
    );
  }
  if (isCookExist.businessNumber !== payload.businessNumber) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Business number is invalid");
  }
  payload.cookId = isCookExist._id;
  if (files) {
    const { validIdImage, selfieImage } = files;
    try {
      // Upload the valid ID image to Cloudinary
      const validIdResult = await sendFileToCloudinary(
        validIdImage.buffer,
        validIdImage.originalname,
        validIdImage.mimetype,
      );

      // Upload the selfie image to Cloudinary
      const selfieResult = await sendFileToCloudinary(
        selfieImage.buffer,
        selfieImage.originalname,
        selfieImage.mimetype,
      );

      // Add the image URLs to the payload or database
      payload.validIdUrl = validIdResult.secure_url;
      payload.selfIdUrl = selfieResult.secure_url;
      const result = await VerifyCookIdModel.create(payload);
      if (!result) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          "Something went wrong during verify",
        );
      }
      const updateUser = await UserModel.findByIdAndUpdate(
        userId,
        { isCookIdVerified: true },
        { new: true }, // To return the updated document
      );

      // Check if update was successful
      if (!updateUser) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          "Failed to update user verification status",
        );
      }
      return result;
    } catch (error) {
      // Handle any errors from Cloudinary upload
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        `File upload failed: ${error}`,
      );
    }
  }
};

export const verifyCookIdServices = {
  verifyIdentity,
};
