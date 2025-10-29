import express from "express";
import auth from "../../middlewares/auth";
import { hygieneControllers } from "./hygieneCompliance.controller";
import { upload } from "../../utils/sendImageToCloudinary";

const router = express.Router();

router.get("/", auth("cook"), hygieneControllers.getHygieneCompliances);
router.post(
  "/upload-pdf",
  auth("cook"),
  upload.array("files"),
  hygieneControllers.uploadHygieneFile,
);

export const hygieneRoutes = router;
