import express from "express";
import auth from "../../middlewares/auth";
import { favouriteControllers } from "./favourite.controllers";

const router = express.Router();

router.get(
  "/my-favorites",
  auth("cook", "user", "admin"),
  favouriteControllers.getMyFavourites,
);
router.delete(
  "/:favoriteId",
  auth("cook", "user", "admin"),
  favouriteControllers.deleteFavorite,
);
router.post(
  "/add",
  auth("cook", "user", "admin"),
  favouriteControllers.addToFavourite,
);

export const favouriteRoutes = router;
