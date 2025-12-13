import express from "express";
import auth from "../../middlewares/auth";
import { selfResRuleControllers } from "./selfResponsibility.controller";

const router = express.Router();

router.get(
  "/",
  auth("admin", "cook"),
  selfResRuleControllers.getSelfResContract,
);
router.patch(
  "/status/:contractId",
  auth("admin", "cook"),
  selfResRuleControllers.updateSelfResStatus,
);
router.post(
  "/add-self-responsibiity-contract",
  auth("admin"),
  selfResRuleControllers.addSelfResRules,
);
router.post(
  "/edit-self-responsibiity-contract/:contractId",
  auth("admin"),
  selfResRuleControllers.updateSelfResRules,
);

export const selfResRoutes = router;
