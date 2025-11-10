import express from "express";
import auth from "../../middlewares/auth";
import { messageControllers } from "./message.controller";

const router = express.Router();

router.post(
  "/send",
  auth("cook", "admin", "user"),
  messageControllers.sendMessage,
);

export const messageRoutes = router;
