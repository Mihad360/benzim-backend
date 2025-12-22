import HttpStatus from "http-status";
import mongoose, { Types } from "mongoose";
import { JwtPayload } from "../../interface/global";
import { IVerifyCookId } from "./verifyCook.interface";
import { UserModel } from "../User/user.model";
import AppError from "../../erros/AppError";
import { CookProfileModel } from "../Cook/cook.model";
import { sendFileToCloudinary } from "../../utils/sendImageToCloudinary";
import VerifyCookIdModel from "./verifyCook.model";
import QueryBuilder from "../../builder/QueryBuilder";
import { QuizCookResultModel } from "../QuizResult/quizresult.model";

const verifyIdentity = async (
  user: JwtPayload,
  payload: IVerifyCookId,
  files: {
    validIdImage: Express.Multer.File;
    selfieImage: Express.Multer.File;
  },
) => {
  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(async () => {
      const userId = new Types.ObjectId(user.user);

      const isUserExist = await UserModel.findById(userId).session(session);
      if (!isUserExist) {
        throw new AppError(HttpStatus.NOT_FOUND, "User not found");
      }

      const isCookExist = await CookProfileModel.findOne({
        userId: isUserExist._id,
      }).session(session);

      if (!isCookExist) {
        throw new AppError(HttpStatus.NOT_FOUND, "Cook not found");
      }

      const isCookAlreadyVerified = await VerifyCookIdModel.findOne({
        cookId: isCookExist._id,
      }).session(session);

      if (isCookAlreadyVerified) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          "You are already verified & exist",
        );
      }

      if (isCookExist.businessNumber !== payload.businessNumber) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          "Business number is invalid",
        );
      }

      // Prepare payload
      payload.cookId = isCookExist._id;
      payload.ownerName = isCookExist.cookName;

      if (!files?.validIdImage || !files?.selfieImage) {
        throw new AppError(HttpStatus.BAD_REQUEST, "Required files missing");
      }

      // 🔹 Upload files (outside DB but inside transaction flow)
      const validIdResult = await sendFileToCloudinary(
        files.validIdImage.buffer,
        files.validIdImage.originalname,
        files.validIdImage.mimetype,
      );

      const selfieResult = await sendFileToCloudinary(
        files.selfieImage.buffer,
        files.selfieImage.originalname,
        files.selfieImage.mimetype,
      );

      payload.validIdUrl = validIdResult.secure_url;
      payload.selfIdUrl = selfieResult.secure_url;

      // 🔹 Create verification record
      const [verifyResult] = await VerifyCookIdModel.create([payload], {
        session,
      });

      if (!verifyResult) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          "Something went wrong during verify",
        );
      }

      // 🔹 Update user verification flag
      const updateUser = await UserModel.findByIdAndUpdate(
        userId,
        { isCookIdVerified: true },
        { new: true, session },
      );

      if (!updateUser) {
        throw new AppError(
          HttpStatus.BAD_REQUEST,
          "Failed to update user verification status",
        );
      }

      return verifyResult;
    });
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const verifyCookSearch = ["ownerName"];

const getVerificationCooks = async (query: Record<string, unknown>) => {
  const usersQuery = new QueryBuilder(
    VerifyCookIdModel.find({ isDeleted: false }).sort({ createdAt: -1 }),
    query,
  )
    .search(verifyCookSearch)
    .filter()
    .sort()
    .paginate()
    .fields();

  const meta = await usersQuery.countTotal();
  const result = await usersQuery.modelQuery;
  return { meta, result };
};

const approveCook = async (cookId: string) => {
  const isCookExist = await CookProfileModel.findById(cookId);
  if (!isCookExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Cook not found");
  }
  const isUserExist = await UserModel.findByIdAndUpdate(
    isCookExist.userId,
    {
      isCookfullyVerified: true,
    },
    { new: true },
  ).select("-password");
  if (!isUserExist) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Cook approve failed");
  }
  return isUserExist;
};

const cookApprovals = async (query: Record<string, unknown>) => {
  const cookQuery = new QueryBuilder(QuizCookResultModel.find(), query)
    .filter()
    .paginate()
    .fields()
    .sort();

  const meta = await cookQuery.countTotal();
  const result = await cookQuery.modelQuery;
  return { meta, result };
};

export const verifyCookIdServices = {
  verifyIdentity,
  getVerificationCooks,
  approveCook,
  cookApprovals,
};
