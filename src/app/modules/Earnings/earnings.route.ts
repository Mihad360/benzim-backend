import express from "express";
import { earningControllers } from "./earnings.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.get(
  "/dashboard-stats",
  auth("admin"),
  earningControllers.getDashboardStats,
);
router.get("/", auth("admin"), earningControllers.getEarnings);

export const earningRoutes = router;
