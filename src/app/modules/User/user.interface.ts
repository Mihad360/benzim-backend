import { Model, Types } from "mongoose";

export interface IUser {
  _id?: Types.ObjectId;
  cookId: Types.ObjectId;
  name: string;
  email?: string;
  phoneNumber?: string;
  password: string;
  role: "cook" | "user" | "admin";
  profileImage: string;
  isActive: boolean;
  otp: string;
  expiresAt: Date;
  isVerified: boolean;
  isDeleted: boolean;
  passwordChangedAt: Date;
  isCookOtpVerified: boolean;
  isKlzhRegistered?: boolean;
  klzhNumber?: string;
  klzhNumberExpiry?: Date;
  isSelfResContract: boolean;
  isHygiened?: boolean;
  isCookIdVerified: boolean;
  stripeAccountId: string;
  isOnboarded: boolean;
}

export interface UserInterface extends Model<IUser> {
  isUserExistByEmail(email: string): Promise<IUser>;
  compareUserPassword(
    payloadPassword: string,
    hashedPassword: string,
  ): Promise<boolean>;
  newHashedPassword(newPassword: string): Promise<string>;
  isOldTokenValid: (
    passwordChangedTime: Date,
    jwtIssuedTime: number,
  ) => Promise<boolean>;
  isJwtIssuedBeforePasswordChange(
    passwordChangeTimeStamp: Date,
    jwtIssuedTimeStamp: number,
  ): boolean;
  isUserExistByCustomId(email: string): Promise<IUser>;
}
