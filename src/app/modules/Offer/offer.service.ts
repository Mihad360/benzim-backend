/* eslint-disable @typescript-eslint/no-explicit-any */
import HttpStatus from "http-status";
import { IOffer } from "./offer.interface";
import OfferModel from "./offer.model";
import AppError from "../../erros/AppError";
import { CookProfileModel } from "../Cook/cook.model";
import { JwtPayload } from "../../interface/global";
import { sendFileToCloudinary } from "../../utils/sendImageToCloudinary";
import QueryBuilder from "../../builder/QueryBuilder";
import { CartModel } from "../Order/order.model";
import { MealModel } from "../Meal/meal.model";

export const createAnOffer = async (
  payload: IOffer,
  user: JwtPayload,
  file?: Express.Multer.File,
) => {
  // 1️⃣ Validate Cook existence
  const isCookExist = await CookProfileModel.findOne({ userId: user.user });
  if (!isCookExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "Cook not found");
  }

  const { code, applicableCategory, applicableMealIds } = payload;
  const now = new Date();

  // 2️⃣ Validate existing active offer (same code / category / meal)
  const query: any = { isActive: true, endDate: { $gte: now } };
  const orConditions: any[] = [{ code }];

  if (applicableCategory?.length) {
    orConditions.push({ applicableCategory: { $in: applicableCategory } });
  }

  if (applicableMealIds?.length) {
    orConditions.push({ applicableMealIds: { $in: applicableMealIds } });
  }

  if (orConditions.length > 0) query.$or = orConditions;

  const existingOffer = await OfferModel.findOne(query);

  if (existingOffer) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "An active offer already exists for this code, category, or meal",
    );
  }

  // 3️⃣ Handle image upload (optional)
  if (file) {
    const uploadResult = await sendFileToCloudinary(
      file.buffer,
      file.originalname,
      file.mimetype,
    );
    if (!uploadResult) {
      throw new AppError(HttpStatus.BAD_REQUEST, "Unable to upload the image");
    }
    payload.image = uploadResult.secure_url;
  }

  // 4️⃣ Attach cookId and create offer
  payload.cookId = isCookExist._id;
  const newOffer = await OfferModel.create(payload);

  return newOffer;
};

export const getOffers = async (query: Record<string, unknown>) => {
  // Only get active offers
  const offerQuery = OfferModel.find({ isActive: true, isDeleted: false });

  // Use your QueryBuilder utilities
  const offers = new QueryBuilder(offerQuery, query)
    .search(["title", "code", "applicableCategory"])
    .filter()
    .fields()
    .paginate()
    .sort();

  const meta = await offers.countTotal();
  const result = await offers.modelQuery;

  if (!result || result.length === 0) {
    throw new AppError(HttpStatus.NOT_FOUND, "No active offers found");
  }

  return { meta, result };
};

const applyPromoCodeToMultipleOrders = async (payload: {
  orderIds: string[];
  promoCode: string;
}) => {
  // 1️⃣ Find the active offer
  const now = new Date();
  const offer = await OfferModel.findOne({
    code: payload.promoCode,
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
  });

  if (!offer)
    throw new AppError(HttpStatus.NOT_FOUND, "Promo code not found or expired");
  // 2️⃣ Find all orders
  const orders = await CartModel.find({
    _id: { $in: payload.orderIds },
    isDeleted: false,
  });
  if (!orders.length)
    throw new AppError(HttpStatus.NOT_FOUND, "No valid orders found");

  let totalDiscount = 0;
  const updatedOrders = [];

  // 3️⃣ Loop through each order and apply discount if eligible
  for (const order of orders) {
    const meal = await MealModel.findById(order.mealId);
    if (!meal) continue;

    const isEligible =
      (offer.applicableMealIds &&
        offer.applicableMealIds.some(
          (id) => id.toString() === meal._id.toString(),
        )) ||
      (offer.applicableCategory &&
        offer.applicableCategory.includes(meal.category));

    if (!isEligible) continue; // skip if not applicable

    // 4️⃣ Calculate discounted price
    let discountedPrice = meal.price;
    if (offer.discountType === "percentage") {
      console.log(meal.price);
      discountedPrice = meal.price - (meal.price * offer.discountValue) / 100;
    } else if (offer.discountType === "flat") {
        discountedPrice = meal.price - offer.discountValue;
    }
    
    if (discountedPrice < 0) discountedPrice = 0;
    
    discountedPrice = Number(discountedPrice.toFixed(2));
    
    // 5️⃣ Update order total
    const totalDiscountedPrice = Number(
        (discountedPrice * order.quantity).toFixed(2),
    );
    order.totalPrice = totalDiscountedPrice;
    await order.save();
    
    const discountAmount = Number(
        (meal.price * order.quantity - totalDiscountedPrice).toFixed(2),
    );
    totalDiscount += discountAmount;
    updatedOrders.push(order);
    console.log(discountedPrice);
  }

  if (!updatedOrders.length)
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Promo code not applicable to any meals",
    );

  return {
    totalDiscount,
    updatedOrders,
  };
};

export const offerServices = {
  createAnOffer,
  getOffers,
  applyPromoCodeToMultipleOrders,
};
