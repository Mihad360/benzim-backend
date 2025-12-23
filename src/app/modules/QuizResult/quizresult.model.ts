import { Schema, model } from "mongoose";
import { IQuizResult } from "./quizresult.interface";

const quizAnswerResultSchema = new Schema(
  {
    question: { type: String, required: true },
    selectedAnswer: { type: String, required: true },
    correctAnswer: { type: String, required: true },
    isCorrect: { type: Boolean, required: true },
  },
  { _id: false },
);

const verifyCookInfoSchema = new Schema(
  {
    ownerName: { type: String },
    businessNumber: { type: String, required: true },
    validIdType: {
      type: String,
      enum: ["passport", "nationalId"],
      required: true,
    },
    validIdUrl: { type: String, required: true },
    selfIdType: {
      type: String,
      enum: ["selfie", "video"],
    },
    selfIdUrl: { type: String },
    status: { type: String },
    isDeleted: { type: Boolean, default: false },
  },
  { _id: false },
);

const quizResultSchema = new Schema<IQuizResult>(
  {
    cookId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    quizId: {
      type: Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    totalQuestions: { type: Number, required: true },
    correctAnswers: { type: Number, required: true },
    wrongAnswers: { type: Number, required: true },

    results: {
      type: [quizAnswerResultSchema],
      required: true,
    },

    // 🔗 Embedded verification data
    verifyCookInfo: {
      type: verifyCookInfoSchema,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

export const QuizCookResultModel = model<IQuizResult>(
  "QuizCookResult",
  quizResultSchema,
);
