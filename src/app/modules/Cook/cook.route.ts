import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { cookControllers } from "./cook.controller";
import { upload } from "../../utils/sendImageToCloudinary";

const router = express.Router();

router.get("/locations", auth("cook", "user"), cookControllers.cooksLocation);
router.get("/profile", auth("cook"), cookControllers.getCookProfile);
router.get(
  "/:cookId",
  auth("cook", "user", "admin"),
  cookControllers.getEachCook,
);
router.post(
  "/become-a-cook",
  auth("cook"),
  upload.fields([
    { name: "profileImage", maxCount: 1 }, // Single file for profile image
    { name: "kitchenImages", maxCount: 5 }, // Multiple files for kitchen images (e.g., up to 5)
    { name: "certificates", maxCount: 3 }, // Multiple files for kitchen images (e.g., up to 5)
  ]),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  cookControllers.becomeACook,
);
router.post(
  "/set-availability/:cookId",
  auth("cook"),
  cookControllers.setAvailability,
);

export const cookRoutes = router;
