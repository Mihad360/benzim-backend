import HttpStatus from "http-status";
import { JwtPayload } from "../../interface/global";
import { ICard } from "./card.interface";
import { CardModel } from "./card.model";
import AppError from "../../erros/AppError";
import { Types } from "mongoose";

const addPaymentCard = async (payload: ICard, user: JwtPayload) => {
  const existingCard = await CardModel.findOne({
    userId: user.user,
    cardNumber: payload.cardNumber,
    isDeleted: false,
  });

  if (existingCard) {
    throw new AppError(HttpStatus.BAD_REQUEST, "Card already exists");
  }
  payload.userId = new Types.ObjectId(user.user);

  const newCard = await CardModel.create(payload);
  return newCard;
};

export const cardServices = {
  addPaymentCard,
};
