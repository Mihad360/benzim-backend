/* eslint-disable @typescript-eslint/no-namespace */
import { Types } from "mongoose";

export interface JwtPayload {
  user: Types.ObjectId | string;
  email?: string;
  role: "cook" | "user" | "admin";
  name: string;
  phoneNumber?: string;
  profileImage?: string;
  // isDeleted?: boolean;
  // iat?: number;
  // exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload;
    }
  }
}

export const USER_ROLE = {
  cook: "cook",
  user: "user",
  admin: "admin",
} as const;

export type TUserRole = keyof typeof USER_ROLE;
