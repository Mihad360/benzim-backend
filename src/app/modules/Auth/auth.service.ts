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
import {
  checkOtp,
  createOnboardingLink,
  generateOtp,
  getExpressDashboardLink,
  verificationEmailTemplate,
} from "./auth.utils";
import { sendEmail } from "../../utils/sendEmail";
import { sendOtp } from "../../utils/twilio";
import { stripe } from "../../utils/STRIPE/stripe.config";

const createAccount = async (payload: IUser) => {
  const isUserExist = await UserModel.findOne({
    email: payload.email,
    phoneNumber: payload.phoneNumber,
  });

  if (isUserExist) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Same user already exists");
  }

  const result = await UserModel.create(payload);

  if (!result) {
    throw new AppError(HttpStatus.BAD_REQUEST, "User creation failed");
  }

  const otp = generateOtp();
  const expireAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  const updatedUser = await UserModel.findByIdAndUpdate(
    result._id,
    {
      otp: otp,
      expiresAt: expireAt,
    },
    { new: true },
  ).select("-password -otp -passwordChangedAt");

  if (!updatedUser) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Failed to update user with OTP",
    );
  }

  const subject = "Verification Code";
  const mail = await sendEmail(
    result.email as string,
    subject,
    verificationEmailTemplate(result.email as string, otp as string),
  );

  if (!mail) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Something went wrong while sending OTP",
    );
  }

  return {
    message: "OTP sent to your email for verification",
    role: result.role,
    data: updatedUser,
  };
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
  const user = await UserModel.findOne(query).select("-otp -passwordChangedAt");

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

  if (!user.isVerified) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    user.otp = otp;
    user.expiresAt = new Date(Date.now() + 5 * 60 * 1000); // +3 minutes
    await user.save();

    const subject = "Verify your account";
    await sendEmail(
      user.email as string,
      subject,
      verificationEmailTemplate(user.email as string, otp),
    );

    return {
      message: "You are not verified. A new verification email has been sent.",
      email: user.email,
    };
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
  let userData = null;

  // If the user is not verified, set them as verified
  if (accessToken && refreshToken && !user.isVerified) {
    userData = await UserModel.findByIdAndUpdate(
      userId,
      { isVerified: true },
      { new: true },
    ).select("-otp -passwordChangedAt -password");
  }

  let onboardingUrl = null;

  // if (!user.stripeAccountId && !user.isOnboarded && user.role === "cook") {
  //   // 1. Create connected account
  //   console.log('hello');
  //   const account = await stripe.accounts.create({
  //     type: "express", // or "standard" if you want
  //     // country: "CH",
  //     email: user.email,
  //   });
  //   console.log(account);
  //   onboardingUrl = await createOnboardingLink(account.id);
  // }

  return {
    role: userData ? userData.role : user.role,
    accessToken,
    refreshToken,
    user: userData ? userData : user,
    onboardingUrl,
  };
};

const createStripeDashboard = async (userId: string) => {
  const user = await UserModel.findById(userId);
  if (!user || !user.stripeAccountId) {
    throw new AppError(HttpStatus.NOT_FOUND, "Cooks stripe account not found");
  }
  const link = await getExpressDashboardLink(user.stripeAccountId);
  return link;
};

const forgetPassword = async (payload: { contact: string }) => {
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
  const expireAt = new Date(Date.now() + 5 * 60 * 1000);

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
      user: check._id,
      name: check.name,
      email: check?.email,
      role: check?.role,
      phoneNumber: check.phoneNumber,
      profileImage: check?.profileImage,
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
    return { role: check.role, accessToken, refreshToken };
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
  ).select("-password -otp -passwordChangedAt");
  if (updateUser) {
    const jwtPayload: JwtPayload = {
      user: updateUser._id,
      name: updateUser.name,
      email: updateUser?.email,
      role: updateUser?.role,
      profileImage: updateUser?.profileImage,
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
    return { accessToken, refreshToken, user: updateUser };
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

    return { accessToken, refreshToken, user: result };
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

const resendOtp = async (email: string) => {
  const user = await UserModel.findOne({ email });

  if (!user) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }

  if (user.isDeleted) {
    throw new AppError(HttpStatus.FORBIDDEN, "This user is deleted");
  }

  // Check if OTP exists and is still valid (not expired)
  if (user.expiresAt && new Date(user.expiresAt) > new Date()) {
    // OTP is still valid, throw an error because you cannot resend it yet
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "OTP is still valid. Please try again after it expires.",
    );
  } else {
    // OTP has expired or has not been set, generate a new OTP
    const otp = generateOtp(); // Generate new OTP
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 1); // Set OTP expiration to 1 minute from now
    // Save the new OTP and expiration time to the user's record
    const updatedUser = await UserModel.findOneAndUpdate(
      { email },
      { otp, expiresAt },
      { new: true },
    ).select("-password -passwordChangedAt -otp");

    // Send email with the new OTP
    const subject = "New Verification Code";
    const mail = await sendEmail(
      user.email as string,
      subject,
      verificationEmailTemplate(updatedUser?.email as string, otp),
    );
    if (!mail) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Something went wrong while sending the email!",
      );
    }
    return { message: "New otp sent to your email", data: updatedUser };
  }
};

const getUsers = async () => {
  const result = await UserModel.find();
  return result;
};

const deleteUser = async (email: string) => {
  const result = await UserModel.findOneAndDelete({ email: email });
  return result;
};

export const authServices = {
  createAccount,
  loginUser,
  forgetPassword,
  resetPassword,
  changePassword,
  verifyOtp,
  resendOtp,
  deleteUser,
  getUsers,
  getExpressDashboardLink,
  createStripeDashboard,
};
