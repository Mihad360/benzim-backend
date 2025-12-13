/* eslint-disable @typescript-eslint/no-explicit-any */
import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import globalErrorHandler from "./app/middlewares/globalErrorHandler";
import notFound from "./app/middlewares/notFound";
import router from "./app/routes";
import cookieParser from "cookie-parser";
import { stripeWebhookHandler } from "./app/utils/STRIPE/webhook";
import { logger, logHttpRequests } from "./app/utils/logger";

const app: Application = express();

// 🟢 STRIPE WEBHOOK MUST COME FIRST - before any body parsing middleware
app.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    console.log("Raw body:", req.body.toString());  // should be raw JSON string
    next();
  },
  stripeWebhookHandler,
);


// 🔴 Now add other middleware AFTER the webhook route
app.use(logHttpRequests);
app.use(express.json()); // This would break webhook if placed before
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
