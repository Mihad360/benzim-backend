import express from "express";
import auth from "../../middlewares/auth";
import { freelanceControllers } from "./freelanceAggrement.controller";

const router = express.Router();

router.get("/", auth("admin", "cook"), freelanceControllers.getFreelance);
router.post(
  "/add-freelance",
  auth("admin"),
  freelanceControllers.addFreelanceAggrement,
);
router.post(
  "/edit-freelance/:id",
  auth("admin"),
  freelanceControllers.updateFreelancerAgreement,
);

export const freelanceRoutes = router;
