import HttpStatus from "http-status";
import catchAsync from "../../utils/catchAsync";
import sendResponse from "../../utils/sendResponse";
import { favouriteServices } from "./favourite.service";
import { JwtPayload } from "../../interface/global";

const addToFavourite = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await favouriteServices.addToFavourite(user, req.body);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "OTP verified successfully",
    data: result,
  });
});

const getMyFavourites = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const result = await favouriteServices.getMyFavourites(user, req.query);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "OTP verified successfully",
    data: result,
  });
});

const deleteFavorite = catchAsync(async (req, res) => {
  const user = req.user as JwtPayload;
  const id = req.params.favoriteId;
  const result = await favouriteServices.deleteFavorite(user, id);

  sendResponse(res, {
    statusCode: HttpStatus.OK,
    success: true,
    message: "OTP verified successfully",
    data: result,
  });
});

export const favouriteControllers = {
  addToFavourite,
  getMyFavourites,
  deleteFavorite,
};
