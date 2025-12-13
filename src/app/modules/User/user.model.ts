import { Schema, model } from "mongoose";
import { IUser, UserInterface } from "./user.interface";
import bcrypt from "bcrypt";

const userSchema = new Schema<IUser, UserInterface>(
  {
    cookId: { type: Schema.Types.ObjectId, ref: "Cook", default: null },
    name: { type: String, required: true },
    email: { type: String },
    phoneNumber: { type: String },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["cook", "user", "admin"],
      required: true,
    },
    profileImage: { type: String },
    isActive: { type: Boolean, default: true },
    otp: { type: String, default: "" },
    expiresAt: { type: Date, default: Date.now },
    isVerified: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    passwordChangedAt: { type: Date, default: null },
    isCookOtpVerified: { type: Boolean, default: false },
    isKlzhRegistered: { type: Boolean, default: false },
    klzhNumber: { type: String },
    klzhNumberExpiry: { type: Date, default: null },
    isSelfResContract: { type: Boolean, default: false },
    isHygiened: { type: Boolean, default: false },
    isCookIdVerified: { type: Boolean, default: false },
    stripeAccountId: { type: String },
    isOnboarded: { type: Boolean },
  },
  { timestamps: true },
);

userSchema.pre("save", async function (next) {
  if (this.password) {
    this.password = await bcrypt.hash(this.password, 12);
    next();
  }
});

userSchema.statics.isUserExistByEmail = async function (email: string) {
  return await UserModel.findOne({ email });
};

userSchema.statics.compareUserPassword = async function (
  payloadPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  const compare = await bcrypt.compare(payloadPassword, hashedPassword);
  return compare;
};

userSchema.statics.newHashedPassword = async function (newPassword: string) {
  const newPass = await bcrypt.hash(newPassword, 12);
  return newPass;
};

userSchema.statics.isOldTokenValid = async function (
  passwordChangedTime: Date,
  jwtIssuedTime: number,
) {
  const passwordLastChangedAt = new Date(passwordChangedTime).getTime() / 1000;
  const jwtIssuedAtInSeconds = jwtIssuedTime;
  if (passwordLastChangedAt > jwtIssuedAtInSeconds) {
    console.log("Token is old.");
  } else {
    console.log("Token is valid.");
  }
  return passwordLastChangedAt > jwtIssuedAtInSeconds;
};

userSchema.statics.isUserExistByCustomId = async function (email: string) {
  return await UserModel.findOne({ email }).select("-password");
};

export const UserModel = model<IUser, UserInterface>("User", userSchema);
