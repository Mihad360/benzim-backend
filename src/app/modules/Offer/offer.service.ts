/* eslint-disable @typescript-eslint/no-explicit-any */
import HttpStatus from "http-status";
import { IOffer } from "./offer.interface";
import OfferModel from "./offer.model";
import AppError from "../../erros/AppError";
import { CookProfileModel } from "../Cook/cook.model";
import { JwtPayload } from "../../interface/global";
import { sendFileToCloudinary } from "../../utils/sendImageToCloudinary";
import QueryBuilder from "../../builder/QueryBuilder";
import { CartModel } from "../Order/cart.model";
import { OrderModel } from "../Orders/orders.model";
import { roundToCent } from "../Orders/orders.service";

/**
 * ✅ Create a new offer
 */
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

  const { code, applicableMealIds } = payload;
  const now = new Date();

  // 2️⃣ Validate existing active offer (same code or meal)
  const query: any = {
    isActive: true,
    endDate: { $gte: now },
    $or: [{ code }],
  };

  if (applicableMealIds?.length) {
    query.$or.push({ applicableMealIds: { $in: applicableMealIds } });
  }

  const existingOffer = await OfferModel.findOne(query);
  if (existingOffer) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "An active offer already exists with this code or meal",
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

/**
 * ✅ Get active offers
 */
export const getOffers = async (query: Record<string, unknown>) => {
  const now = new Date();
  const offerQuery = OfferModel.find({
    isActive: true,
    isDeleted: false,
    startDate: { $lte: now },
    endDate: { $gte: now },
  });

  const offers = new QueryBuilder(offerQuery, query)
    .search(["title", "code"])
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

/**
 * ✅ Apply promo code to multiple orders
 */
export const applyPromoCodeToOrder = async (
  orderId: string,
  payload: { promoCode: string },
) => {
  const now = new Date();

  // 1️⃣ Find the active offer
  const offer = await OfferModel.findOne({
    code: payload.promoCode,
    isActive: true,
    isDeleted: false,
    startDate: { $lte: now },
    endDate: { $gte: now },
  });

  if (!offer) {
    throw new AppError(HttpStatus.NOT_FOUND, "Promo code not found or expired");
  }

  // 2️⃣ Check max usage limit for the offer
  if (offer.max) {
    // Count how many orders have already used this promo code
    const usedCount = await OrderModel.findOne({
      _id: orderId,
      status: { $ne: "cancelled" }, // Don't count cancelled orders
    });
    if (!usedCount) {
      throw new AppError(HttpStatus.NOT_FOUND, "order not found");
    }
    if (usedCount.maxCompleted >= offer.max) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Promo code usage limit reached",
      );
    }
  }

  // 3️⃣ Find the target order
  const order = await OrderModel.findById(orderId);
  if (!order) {
    throw new AppError(HttpStatus.NOT_FOUND, "Order not found");
  }

  // 4️⃣ Check if order has already reached maxCompleted limit
  if (order.maxCompleted && typeof order.maxCompleted === "number") {
    // If maxCompleted is a number, check if it's reached the limit
    // You might want to adjust this logic based on your business rules
    if (order.maxCompleted >= (offer.max || 0)) {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Order has reached maximum discount usage",
      );
    }
  }

  // 5️⃣ Fetch all related cart items with meal details
  const carts = await CartModel.find({
    _id: { $in: order.cartIds },
    isDeleted: false,
  }).populate("mealId");

  if (!carts.length) {
    throw new AppError(HttpStatus.NOT_FOUND, "No valid carts found for order");
  }

  let newOrderTotal = 0;
  let totalDiscount = 0;
  let applicableMeals = 0;

  // 6️⃣ Calculate new order total with discounts applied only to eligible meals
  for (const cart of carts) {
    const meal = cart.mealId as any;
    if (!meal) continue;

    const quantity = cart.quantity ?? 1;
    const mealPrice = meal.price;

    // Check if this meal is eligible for discount
    let isEligible = false;

    if (offer.offerScope === "meal") {
      // Only apply discount if meal ID exists in applicableMealIds
      isEligible = !!offer.applicableMealIds?.some(
        (id) => id.toString() === meal._id.toString(),
      );
    } else if (
      offer.offerScope === "global" ||
      offer.offerScope === "delivery"
    ) {
      // Apply to all meals for global/delivery offers
      isEligible = true;
    }

    if (isEligible) {
      applicableMeals++;

      // Calculate discounted price per meal unit
      let discountedPricePerUnit = mealPrice;

      if (offer.discountType === "percentage") {
        const discountAmount = (mealPrice * offer.discountValue) / 100;
        discountedPricePerUnit = Math.max(mealPrice - discountAmount, 0);
      } else if (offer.discountType === "flat") {
        discountedPricePerUnit = Math.max(mealPrice - offer.discountValue, 0);
      }

      // Calculate total for this cart item (discounted price × quantity)
      const cartItemTotal = discountedPricePerUnit * quantity;
      newOrderTotal += cartItemTotal;

      // Calculate discount amount for this cart item
      const originalCartItemTotal = mealPrice * quantity;
      const cartItemDiscount = originalCartItemTotal - cartItemTotal;
      totalDiscount += cartItemDiscount;

      console.log(
        `Eligible Meal: ${meal.name}, Quantity: ${quantity}, Original: $${mealPrice}, Discounted: $${discountedPricePerUnit}, Cart Total: $${cartItemTotal}, Discount: $${cartItemDiscount}`,
      );
    } else {
      // Meal not eligible - add original price
      const cartItemTotal = mealPrice * quantity;
      newOrderTotal += cartItemTotal;

      console.log(
        `Non-Eligible Meal: ${meal.name}, Quantity: ${quantity}, Price: $${mealPrice}, Cart Total: $${cartItemTotal}`,
      );
    }
  }

  // 7️⃣ If no meals were eligible, stop here
  if (applicableMeals === 0) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Promo code not applicable to any meals in this order",
    );
  }

  // 8️⃣ Update the order total and track usage
  const originalOrderTotal = order.totalAmount;
  order.totalAmount = roundToCent(Number(newOrderTotal));
  order.discountedAmount = roundToCent(Number(totalDiscount));
  order.promoCode = payload.promoCode;
  // Update maxCompleted - increment by 1 each time promo is successfully applied
  if (typeof order.maxCompleted === "number") {
    order.maxCompleted += 1;
  } else {
    // If it's string or undefined, initialize as number
    order.maxCompleted = 1;
  }

  await order.save();

  // 9️⃣ Optional: You might want to track offer usage in a separate collection
  // for better analytics and reporting
  //   await trackOfferUsage(offer._id, order._id, totalDiscount);

  return {
    orderId: order._id,
    promoCode: offer.code,
    originalTotalAmount: roundToCent(Number(originalOrderTotal)),
    totalDiscount: roundToCent(Number(totalDiscount)),
    newTotalAmount: order.totalAmount,
    applicableMealsCount: applicableMeals,
    maxCompleted: order.maxCompleted,
    // remainingUsage: offer.max
    //   ? offer.max - (await getOfferUsageCount(offer._id))
    //   : "Unlimited",
    message: `Discount applied to ${applicableMeals} meal(s)`,
  };
};

export const offerServices = {
  createAnOffer,
  getOffers,
  applyPromoCodeToOrder,
};
