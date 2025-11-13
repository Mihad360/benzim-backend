/* eslint-disable @typescript-eslint/no-explicit-any */
import bcrypt from "bcrypt";
import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { IUser } from "../User/user.interface";
import { UserModel } from "../User/user.model";
import { createToken } from "../../utils/jwt";
import { JwtPayload } from "../../interface/global";
import config from "../../config";
import mongoose, { Types } from "mongoose";
import { IAuth } from "./auth.interface";
import { checkOtp, generateOtp, verificationEmailTemplate } from "./auth.utils";
import { sendEmail } from "../../utils/sendEmail";
import { sendOtp } from "../../utils/twilio";

const createAccount = async (payload: IUser) => {
  const isUserExist = await UserModel.findOne({
    email: payload.email,
    phoneNumber: payload.phoneNumber,
  });
  if (isUserExist) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Same user is already exist");
  }
  const result = await UserModel.create(payload);
  if (result) {
    const jwtPayload: JwtPayload = {
      user: result._id as Types.ObjectId,
      name: result.name,
      email: result?.email,
      phoneNumber: result.phoneNumber,
      role: result?.role,
    };

    const accessToken = createToken(
      jwtPayload,
      config.jwt_access_secret as string,
      config.jwt_access_expires_in as string,
    );

    const refreshToken = createToken(
      jwtPayload,
      config.jwt_refresh_secret as string,
      config.jwt_refresh_expires_in as string,
    );

    if (accessToken && refreshToken && !result.isVerified) {
      await UserModel.findByIdAndUpdate(result._id, {
        isVerified: true,
      });
    }

    return {
      role: result.role,
      accessToken,
      refreshToken,
    };
  }
};

const loginUser = async (payload: IAuth) => {
  // Ensure at least one of phoneNumber or email is provided
  if (!payload.phoneNumber && !payload.email) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Either phone number or email must be provided",
    );
  }
  if (payload.phoneNumber && payload.email) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Multiple values provided");
  }

  // Create a query object to search by phoneNumber or email (whichever is provided)
  const query: any = {};
  if (payload.phoneNumber) query.phoneNumber = payload.phoneNumber;
  if (payload.email) query.email = payload.email;

  // Find the user based on the provided query (either phoneNumber or email)
  const user = await UserModel.findOne(query);

  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user is not found");
  }

  // Check if the user is deleted (blocked)
  if (user?.isDeleted) {
    throw new AppError(HttpStatus.BAD_REQUEST, "The user is already blocked");
  }

  // Check if the password is correct
  if (!(await UserModel.compareUserPassword(payload.password, user.password))) {
    throw new AppError(HttpStatus.FORBIDDEN, "Password did not match");
  }

  const userId = user?._id;

  if (!userId) {
    throw new AppError(HttpStatus.NOT_FOUND, "The user ID is missing");
  }

  // Create the JWT payload
  const jwtPayload: JwtPayload = {
    user: userId,
    name: user.name,
    phoneNumber: user.phoneNumber,
    email: user?.email,
    role: user?.role,
  };

  // Create the JWT access token
  const accessToken = createToken(
    jwtPayload,
    config.jwt_access_secret as string,
    config.jwt_access_expires_in as string,
  );

  const refreshToken = createToken(
    jwtPayload,
    config.jwt_refresh_secret as string,
    config.jwt_refresh_expires_in as string,
  );

  // If the user is not verified, set them as verified
  if (accessToken && refreshToken && !user.isVerified) {
    await UserModel.findByIdAndUpdate(userId, {
      isVerified: true,
    });
  }

  return {
    role: user.role,
    accessToken,
    refreshToken,
  };
};

const forgetPassword = async (payload: { contact: string }) => {
  // ✅ Validate input type
  console.log(payload.contact);
  if (typeof payload.contact !== "string") {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "The contact must be a valid string (email or phone number).",
    );
  }

  const isEmail = payload.contact.includes("@");

  // ✅ Find user by email or phone
  const user = await UserModel.findOne({
    [isEmail ? "email" : "phoneNumber"]: payload.contact,
  });

  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "This user does not exist");
  }

  if (user.isDeleted) {
    throw new AppError(HttpStatus.FORBIDDEN, "This user is deleted");
  }

  const userId = user._id;
  if (!userId) {
    throw new AppError(HttpStatus.NOT_FOUND, "User ID is missing");
  }

  // ✅ Generate OTP and expiration
  const otp = generateOtp();
  const expireAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min expiry

  // ✅ Update user with OTP
  const updatedUser = await UserModel.findByIdAndUpdate(
    userId,
    { otp, expiresAt: expireAt, isVerified: false },
    { new: true },
  );

  if (!updatedUser) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Something went wrong!");
  }

  // ✅ Send OTP via email or phone
  if (isEmail) {
    const subject = "Password Reset Verification Code";
    const mail = await sendEmail(
      updatedUser.email as string,
      subject,
      verificationEmailTemplate(updatedUser.email as string, otp),
    );

    if (!mail.success) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Failed to send OTP email");
    }

    console.log("✅ OTP sent via email to:", updatedUser.email);
    return { success: true, method: "email" };
  } else {
    // ✅ Send via Twilio SMS
    const sms = await sendOtp(payload.contact, otp);
    console.log("✅ OTP sent via SMS:", sms);

    return { success: true, method: "sms" };
  }
};

const verifyOtp = async (payload: { email: string; otp: string }) => {
  const user = await UserModel.findOne({
    email: payload.email,
  });

  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "This User is not exist");
  }
  if (user?.isDeleted) {
    throw new AppError(HttpStatus.FORBIDDEN, "This User is deleted");
  }

  if (user.expiresAt && new Date(user.expiresAt) < new Date()) {
    await UserModel.findOneAndUpdate(
      { email: user.email },
      {
        otp: null,
        expiresAt: null,
        isVerified: false,
      },
      { new: true },
    );
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "The Otp has expired. Try again!",
    );
  }
  const check = await checkOtp(payload.email, payload.otp);
  if (check) {
    const jwtPayload: JwtPayload = {
      user: user._id,
      name: user.name,
      email: user?.email,
      role: user?.role,
      phoneNumber: user.phoneNumber,
      profileImage: user?.profileImage,
    };

    const accessToken = createToken(
      jwtPayload,
      config.jwt_access_secret as string,
      "5m",
    );
    return { accessToken };
  }
};

const resetPassword = async (
  payload: { newPassword: string },
  userInfo: JwtPayload,
) => {
  const user = await UserModel.findOne({
    email: userInfo.email,
  });

  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "This User is not exist");
  }
  if (user?.isDeleted) {
    throw new AppError(HttpStatus.FORBIDDEN, "This User is deleted");
  }
  // Check if password was changed recently (within the last 5 minutes)
  const passwordChangedAt = user.passwordChangedAt;
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000); // 5 minutes in milliseconds

  if (passwordChangedAt && passwordChangedAt > fiveMinutesAgo) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Password was recently changed. Please try again after 5 minutes.",
    );
  }

  const newHashedPassword = await UserModel.newHashedPassword(
    payload.newPassword,
  );
  const updateUser = await UserModel.findOneAndUpdate(
    { email: user.email },
    {
      password: newHashedPassword,
      passwordChangedAt: new Date(),
    },
    { new: true },
  );
  if (updateUser) {
    const jwtPayload: JwtPayload = {
      user: user._id,
      name: user.name,
      email: user?.email,
      role: user?.role,
      profileImage: user?.profileImage,
    };

    const accessToken = createToken(
      jwtPayload,
      config.jwt_access_secret as string,
      config.jwt_access_expires_in as string,
    );
    return { accessToken };
  }
};

const changePassword = async (
  userId: string | Types.ObjectId,
  payload: { currentPassword: string; newPassword: string },
) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const id = new Types.ObjectId(userId);
    const user = await UserModel.findById(id)
      .select("+password")
      .session(session);

    if (!user) {
      throw new AppError(HttpStatus.NOT_FOUND, "User not found");
    }
    if (user.isDeleted) {
      throw new AppError(HttpStatus.FORBIDDEN, "User is blocked");
    }
    if (!payload.currentPassword || !payload.newPassword) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Password is missing");
    }

    // Verify current password
    const isMatch = await bcrypt.compare(
      payload.currentPassword,
      user.password,
    );
    if (!isMatch) {
      throw new AppError(
        HttpStatus.UNAUTHORIZED,
        "Current password is incorrect",
      );
    }

    // Hash new password
    const newPass = await bcrypt.hash(payload.newPassword, 12);

    // Update user with transaction
    const result = await UserModel.findByIdAndUpdate(
      user._id,
      {
        password: newPass,
        passwordChangedAt: new Date(),
      },
      { new: true, session },
    );

    if (!result) {
      throw new AppError(HttpStatus.UNAUTHORIZED, "Something went wrong");
    }

    // Commit transaction
    await session.commitTransaction();

    // Introduce artificial delay (2-3 seconds)
    await new Promise((resolve) => setTimeout(resolve, 2500));

    const jwtPayload: JwtPayload = {
      user: result._id as Types.ObjectId,
      name: result.name,
      email: result?.email,
      phoneNumber: result.phoneNumber,
      role: result?.role,
    };

    const accessToken = createToken(
      jwtPayload,
      config.jwt_access_secret as string,
      config.jwt_access_expires_in as string,
    );

    const refreshToken = createToken(
      jwtPayload,
      config.jwt_refresh_secret as string,
      config.jwt_refresh_expires_in as string,
    );

    return { accessToken, refreshToken };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

export const authServices = {
  createAccount,
  loginUser,
  forgetPassword,
  resetPassword,
  changePassword,
  verifyOtp,
};
