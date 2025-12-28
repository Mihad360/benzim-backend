import { Response } from "express";

type TMeta = {
  limit: number;
  page: number;
  total: number;
  totalPage: number;
};

type TResponse<T> = {
  statusCode: number;
  success: boolean;
  message: string;
  quantities?: number;
  totalPrice?: number;
  meta?: TMeta;
  data: T;
};

const sendResponse = <T>(res: Response, data: TResponse<T>) => {
  res.status(data?.statusCode).json({
    success: data.success,
    message: data.message,
    meta: data.meta,
    quantities: data.quantities, // ← Add this
    totalPrice: data.totalPrice,
    data: data.data,
  });
};

export default sendResponse;
