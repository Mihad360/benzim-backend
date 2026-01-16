import HttpStatus from "http-status";
import QueryBuilder from "../../builder/QueryBuilder";
import AppError from "../../erros/AppError";
import { EarningModel } from "./earnings.model";
import { UserModel } from "../User/user.model";
import { CookProfileModel } from "../Cook/cook.model";
import mongoose from "mongoose";

const searchEarnings = ["orderNo", "status"];

const getEarnings = async (query: Record<string, unknown>) => {
  const earningQuery = new QueryBuilder(EarningModel.find(), query)
    .search(searchEarnings)
    .filter()
    .paginate()
    .fields();
  const meta = await earningQuery.countTotal();
  const result = await earningQuery.modelQuery;
  return { meta, result };
};

const getDashboardStats = async (year?: number) => {
  const session = await mongoose.startSession();
  try {
    session.startTransaction();

    // Use current year if not provided
    const selectedYear = year || new Date().getFullYear();

    // Get total users count
    const totalUsers = await UserModel.countDocuments({
      isDeleted: false,
    }).session(session);

    // Get total cooks count (assuming there's a Cook model)
    const totalCooks = await CookProfileModel.countDocuments({
      isDeleted: false,
    }).session(session);

    // Get total admin earnings (sum of all adminEarn)
    const totalEarningsResult = await EarningModel.aggregate([
      {
        $match: {
          isDeleted: false,
          status: "completed", // Only count completed earnings
        },
      },
      {
        $group: {
          _id: null,
          totalEarnings: { $sum: "$adminEarn" },
        },
      },
    ]).session(session);

    const totalEarnings =
      totalEarningsResult.length > 0 ? totalEarningsResult[0].totalEarnings : 0;

    // Get monthly earnings for the selected year
    const monthlyEarnings = await EarningModel.aggregate([
      {
        $match: {
          isDeleted: false,
          status: "completed",
          createdAt: {
            $gte: new Date(`${selectedYear}-01-01T00:00:00.000Z`),
            $lte: new Date(`${selectedYear}-12-31T23:59:59.999Z`),
          },
        },
      },
      {
        $group: {
          _id: { $month: "$createdAt" },
          earnings: { $sum: "$adminEarn" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]).session(session);

    // Format monthly earnings to include all 12 months
    const monthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const formattedMonthlyEarnings = monthNames.map((month, index) => {
      const monthData = monthlyEarnings.find((item) => item._id === index + 1);
      return {
        month,
        earnings: monthData ? monthData.earnings : 0,
      };
    });

    await session.commitTransaction();

    return {
      totalUsers,
      totalCooks,
      totalEarnings,
      yearlyEarnings: {
        year: selectedYear,
        monthlyData: formattedMonthlyEarnings,
      },
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    await session.abortTransaction();
    throw new AppError(HttpStatus.BAD_REQUEST, error.message);
  } finally {
    await session.endSession();
  }
};

export const earningServices = {
  getEarnings,
  getDashboardStats,
};
