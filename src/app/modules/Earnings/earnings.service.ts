import QueryBuilder from "../../builder/QueryBuilder";
import { EarningModel } from "./earnings.model";

const getEarnings = async (query: Record<string, unknown>) => {
  const earningQuery = new QueryBuilder(EarningModel.find(), query)
    .filter()
    .paginate()
    .fields();
  const meta = await earningQuery.countTotal();
  const result = await earningQuery.modelQuery;
  return { meta, result };
};

export const earningServices = {
  getEarnings,
};
