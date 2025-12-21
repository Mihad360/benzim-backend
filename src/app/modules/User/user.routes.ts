import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/sendImageToCloudinary";
import { userControllers } from "./user.controller";

const router = express.Router();

router.get("/", auth("user", "cook", "admin"), userControllers.getAllUsers);
router.get("/me", auth("user", "cook", "admin"), userControllers.getMe);
router.patch(
  "/track-me",
  auth("user", "cook", "admin"),
  userControllers.trackPagesUpdate,
);
router.patch(
  "/edit-profile",
  auth("user", "cook", "admin"),
  upload.single("image"),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  userControllers.editUserProfile,
);

export const userRoutes = router;
