import { model, Schema } from "mongoose";
import { Course, Option, Quiz } from "./course.interface";

const OptionSchema = new Schema<Option>({
  optionText: { type: String, required: true },
  isCorrect: { type: Boolean, required: true },
});

const QuizSchema = new Schema<Quiz>({
  question: { type: String, required: true },
  questionType: {
    type: String,
    enum: ["multiple-choice", "true-false", "fill-in-the-blank"],
    required: true,
  },
  options: { type: [OptionSchema], required: true },
  correctAnswer: { type: Schema.Types.Mixed, required: true }, // Can store both single or array of correct answers
});

const CourseSchema = new Schema<Course>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    fileType: { type: String, enum: ["video", "pdf", "quiz"], required: true },
    fileUrl: { type: String, default: null },
    filename: { type: String, default: null },
    mimetype: { type: String, default: null },
    quizzes: { type: [QuizSchema], default: [] },
  },
  { timestamps: true },
);

const CourseModel = model<Course>("Course", CourseSchema);

export default CourseModel;
