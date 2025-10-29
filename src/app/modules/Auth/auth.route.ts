import express from "express";
import { authControllers } from "./auth.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.post("/create-account", authControllers.createAccount);
router.post("/login", authControllers.loginUser);
router.post("/forget-password", authControllers.forgetPassword);
router.post(
  "/reset-password",
  auth("admin", "cook", "user"),
  authControllers.resetPassword,
);
router.post("/verify-otp", authControllers.verifyOtp);
router.post(
  "/change-password",
  auth("admin", "user", "cook"),
  authControllers.changePassword,
);

export const authRoutes = router;
