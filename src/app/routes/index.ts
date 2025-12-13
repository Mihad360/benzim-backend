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
import { mealRoutes } from "../modules/Meal/meal.route";
import { categoryRoutes } from "../modules/Category/category.route";
import { offerRoutes } from "../modules/Offer/offer.route";
import { paymentRoutes } from "../modules/Payment/payment.route";
import { cartRoutes } from "../modules/Order/cart.route";
import { orderRoutes } from "../modules/Orders/orders.route";
import { messageRoutes } from "../modules/Message/message.route";
import { reviewRoutes } from "../modules/Review/review.route";
import { cardRoutes } from "../modules/Card/card.route";
import { conversationRoutes } from "../modules/Conversation/conversation.route";
import { favouriteRoutes } from "../modules/Favourite/favourite.route";

const router = Router();

const moduleRoutes = [
  {
    path: "/users",
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
  {
    path: "/meal",
    route: mealRoutes,
  },
  {
    path: "/cart",
    route: cartRoutes,
  },
  {
    path: "/category",
    route: categoryRoutes,
  },
  {
    path: "/offer",
    route: offerRoutes,
  },
  {
    path: "/payment",
    route: paymentRoutes,
  },
  {
    path: "/order",
    route: orderRoutes,
  },
  {
    path: "/message",
    route: messageRoutes,
  },
  {
    path: "/review",
    route: reviewRoutes,
  },
  {
    path: "/card",
    route: cardRoutes,
  },
  {
    path: "/conversation",
    route: conversationRoutes,
  },
  {
    path: "/favorites",
    route: favouriteRoutes,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route?.route));

// router.use("/students", StudentRoutes);
// router.use("/users", UserRoutes);

export default router;