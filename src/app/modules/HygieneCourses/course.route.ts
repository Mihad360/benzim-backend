import express, { NextFunction, Request, Response } from "express";
import auth from "../../middlewares/auth";
import { upload } from "../../utils/sendImageToCloudinary";
import { courseControllers } from "./course.controller";

const router = express.Router();

router.get("/", auth("admin", "cook"), courseControllers.getCourses);
router.post("/add-quiz", auth("admin"), courseControllers.addQuizes);
router.post(
  "/add-hygiene-course",
  auth("admin"),
  upload.array("files"),
  (req: Request, res: Response, next: NextFunction) => {
    if (req.body.data) {
      req.body = JSON.parse(req.body.data);
    }
    next();
  },
  courseControllers.addCourse,
);

export const hygienceCourseRoutes = router;
