import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { verifyCookIdControllers } from "./verifyCook.controller";
import { upload } from "../../utils/sendImageToCloudinary";

const router = express.Router();

router.post(
  "/verify-cook-id",
  auth("cook"),
  upload.fields([
    { name: "validIdImage", maxCount: 1 }, // Field for valid ID image
    { name: "selfieImage", maxCount: 1 }, // Field for selfie image
  ]),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  verifyCookIdControllers.addSelfResRules,
);

export const verifyCookIdRoutes = router;
