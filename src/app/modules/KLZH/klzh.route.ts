import express from "express";
import { klzhControllers } from "./klzh.controller";
import auth from "../../middlewares/auth";

const router = express.Router();

router.post("/register-klzh", auth("cook"), klzhControllers.registerKlzh);
router.post("/verify-klzh", auth("cook"), klzhControllers.verifyBusinessNumber);

export const klzhRoutes = router;
