/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import router from "./app/routes";
import cookieParser from "cookie-parser";
import { stripeWebhookHandler } from "./app/utils/STRIPE/webhook";
import { logger, logHttpRequests } from "./app/utils/logger";
const app: Application = express();

app.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  stripeWebhookHandler,
);

app.use(logHttpRequests);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use(
  cors({
    origin: "*",
    credentials: true,
  }),
);

app.use(express.static("public"));

app.use("/api/v1", router);

const test = async (req: Request, res: Response) => {
  const a = 10;
  res.send(a);
};

app.get("/", test);

app.use(globalErrorHandler);
app.use(notFound);

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  logger.error(`Error occurred: ${err.message}`, { stack: err.stack });
  next(err);
});

export default app;
