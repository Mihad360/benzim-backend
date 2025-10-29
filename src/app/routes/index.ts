import { Router } from "express";
import { userRoutes } from "../modules/User/user.routes";
import { authRoutes } from "../modules/Auth/auth.route";
import { klzhRoutes } from "../modules/KLZH/klzh.route";
import { hygieneRoutes } from "../modules/HygieneCompliance/hygieneCompliance.route";
import { cookRoutes } from "../modules/Cook/cook.route";
import { freelanceRoutes } from "../modules/FreelanceAggrement/freelanceAggrement.route";
import { selfResRoutes } from "../modules/SelfResponsibility/selfResponsibility.route";
import { hygienceCourseRoutes } from "../modules/HygieneCourses/course.route";
import { verifyCookIdRoutes } from "../modules/VerifyCookId/verifyCook.route";

const router = Router();

const moduleRoutes = [
  {
    path: "/user",
    route: userRoutes,
  },
  {
    path: "/auth",
    route: authRoutes,
  },
  {
    path: "/klzh",
    route: klzhRoutes,
  },
  {
    path: "/hygiene-compliance",
    route: hygieneRoutes,
  },
  {
    path: "/cook",
    route: cookRoutes,
  },
  {
    path: "/freelance",
    route: freelanceRoutes,
  },
  {
    path: "/contracts",
    route: selfResRoutes,
  },
  {
    path: "/courses",
    route: hygienceCourseRoutes,
  },
  {
    path: "/cook-verify",
    route: verifyCookIdRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route?.route));

// router.use("/students", StudentRoutes);
// router.use("/users", UserRoutes);

export default router;
