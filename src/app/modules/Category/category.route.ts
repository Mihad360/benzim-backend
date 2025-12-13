import express from "express";
import { categoryControllers } from "./category.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.get("/", auth("cook", "admin"), categoryControllers.getCategories);
router.post("/add-category", auth("cook"), categoryControllers.addCategory);

export const categoryRoutes = router;
