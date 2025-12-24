import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { mealControllers } from "./meal.controller";
import { upload } from "../../utils/sendImageToCloudinary";

const router = express.Router();

router.get("/", auth("cook", "admin", "user"), mealControllers.getMyMeals);
router.post(
  "/add-meal",
  auth("cook"),
  upload.array("images"),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  mealControllers.addMeal,
);

export const mealRoutes = router;
