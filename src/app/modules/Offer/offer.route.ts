import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { offerControllers } from "./offer.controller";
import { upload } from "../../utils/sendImageToCloudinary";

const router = express.Router();

router.get(
  "/offers",
  auth("user", "cook", "admin"),
  offerControllers.getOffers,
);
router.post(
  "/confirm-offer",
  auth("user", "cook", "admin"),
  offerControllers.applyPromoCodeToMultipleOrders,
);
router.post(
  "/create-offer",
  auth("cook"),
  upload.single("image"),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  offerControllers.createAnOffer,
);

export const offerRoutes = router;
