import { Types } from "mongoose";

export interface IQuizAnswerResult {
  question: string;
  selectedAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

/**
 * Verification info embedded inside quiz result
 */
export interface IVerifyCookInfo {
  ownerName?: string;
  businessNumber: string;
  validIdType: "passport" | "nationalId";
  validIdUrl: string;
  selfIdType?: "selfie" | "video";
  selfIdUrl?: string;
  isDeleted?: boolean;
}

export interface IQuizResult {
  cookId: Types.ObjectId;
  quizId: Types.ObjectId;

  // Quiz summary
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;

  // Quiz details
  results: IQuizAnswerResult[];

  // 🔗 Verification snapshot (important)
  verifyCookInfo: IVerifyCookInfo;

  createdAt?: Date;
  updatedAt?: Date;
}
