import express from "express";
import auth from "../../middlewares/auth";
import { conversationControllers } from "./conversation.controller";

const router = express.Router();

router.get(
  "/",
  auth("cook", "admin", "user"),
  conversationControllers.getMyConversation,
);
router.get(
  "/:id",
  auth("cook", "admin", "user"),
  conversationControllers.getEachConversation,
);

export const conversationRoutes = router;
