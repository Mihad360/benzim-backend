/* eslint-disable @typescript-eslint/no-explicit-any */
import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { sendFileToCloudinary } from "../../utils/sendImageToCloudinary";
import { Course, QuizSubmitPayload } from "./course.interface";
import CourseModel from "./course.model";
import QueryBuilder from "../../builder/QueryBuilder";
import { UserModel } from "../User/user.model";
import { JwtPayload } from "../../interface/global";
import { Types } from "mongoose";
import VerifyCookIdModel from "../VerifyCookId/verifyCook.model";
import { QuizCookResultModel } from "../QuizResult/quizresult.model";

const addCourse = async (files: Express.Multer.File[], payload: Course) => {
  try {
    // Initialize an array to store the created courses
    const createdCourses: Course[] = [];

    // Handle video and PDF uploads
    if (files && files.length > 0) {
      for (const file of files) {
        let fileType: "video" | "pdf" = "pdf"; // Default type to PDF

        // Determine file type and handle accordingly
        if (file.mimetype?.startsWith("video/")) {
          fileType = "video";
        }

        // Upload file to Cloudinary
        const result = await sendFileToCloudinary(
          file.buffer,
          file.originalname,
          file.mimetype,
        );
        // Create the course document based on the file type
        const course = new CourseModel({
          ...payload, // Assuming description is the same for all courses
          fileType: fileType,
          fileUrl: result.secure_url, // Cloudinary file URL
          filename: result.display_name, // Original file name from Cloudinary
          mimetype: file.mimetype, // File MIME type
        });

        // Save the course to the database
        const savedCourse = await course.save();
        createdCourses.push(savedCourse); // Add the saved course to the array
      }
    }

    // Return all the created courses
    return createdCourses;
  } catch (error) {
    console.error("Error adding course:", error);
    throw new AppError(HttpStatus.BAD_REQUEST, "Error adding course: " + error);
  }
};

const getCourses = async (user: JwtPayload, query: Record<string, unknown>) => {
  const userId = new Types.ObjectId(user.user);
  const isUserExist = await UserModel.findById(userId);
  if (!isUserExist) {
    throw new AppError(HttpStatus.NOT_FOUND, "User not found");
  }
  const courses = new QueryBuilder(CourseModel.find(), query).filter();

  if (!courses) {
    throw new AppError(HttpStatus.NOT_FOUND, "session not found");
  }
  const meta = await courses.countTotal();
  const result = await courses.modelQuery;
  return { meta, result };
};

const addQuizes = async (courseData: Course) => {
  try {
    // Check if the courseData and quizzes are provided
    if (!courseData || !courseData.quizzes || courseData.quizzes.length === 0) {
      throw new Error("Invalid course data or quizzes");
    }

    // Validate each quiz
    courseData.quizzes.forEach((quiz) => {
      if (
        !quiz.question ||
        !quiz.questionType ||
        !quiz.options ||
        quiz.options.length === 0
      ) {
        throw new Error(
          "Each quiz must contain a question, questionType, and options",
        );
      }
    });

    // Create a new course with the provided course data (which includes quizzes)
    const newCourse = await CourseModel.create(courseData);

    return newCourse; // Return the newly created course document
  } catch (error) {
    console.error("Error creating course and quizzes:", error);
    throw new AppError(HttpStatus.BAD_REQUEST, "Something went wrong");
  }
};

const submitQuiz = async (
  user: JwtPayload,
  quizId: string,
  payload: QuizSubmitPayload,
) => {
  const userId = new Types.ObjectId(user.user);
  const quizzes = await CourseModel.findById(quizId);
  if (!quizzes) {
    throw new AppError(HttpStatus.NOT_FOUND, "Quiz not found");
  }
  const quiz = quizzes.quizzes;
  if (payload.answers.length !== quiz?.length) {
    throw new Error("All questions must be answered");
  }

  let score = 0;
  const results: {
    questionId?: string;
    question: string;
    selectedAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
  }[] = [];
  for (const answer of payload.answers) {
    const quize = quiz.find(
      (q: any) => q._id?.toString() === answer.questionId,
    );
    if (!quize) {
      throw new Error(`Invalid question ID: ${answer.questionId}`);
    }

    const selectedOption = quize.options.find(
      (opt) => opt.optionText === answer.selectedAnswer,
    );

    if (!selectedOption) {
      throw new Error(
        `Invalid answer "${answer.selectedAnswer}" for question "${quize.question}"`,
      );
    }

    const correctOption = quize.options.find((opt) => opt.isCorrect);

    const isCorrect = correctOption?.optionText === answer.selectedAnswer;

    if (isCorrect) score++;

    results.push({
      // questionId: quize._id,
      question: quize.question,
      selectedAnswer: answer.selectedAnswer,
      correctAnswer: correctOption?.optionText || "",
      isCorrect,
    });
  }
  let updateUser;
  if (results.length) {
    updateUser = await UserModel.findByIdAndUpdate(
      userId,
      {
        isCookQuiz: true,
      },
      { new: true },
    );
    if (!updateUser) {
      throw new AppError(HttpStatus.BAD_REQUEST, "User update failed");
    }
  }

  if (updateUser && !updateUser.cookId) {
    throw new AppError(
      HttpStatus.BAD_REQUEST,
      "Cook profile not found for this user",
    );
  }

  // 4️⃣ Find verification data by cookId
  const verifyCook = await VerifyCookIdModel.findOne({
    cookId: updateUser?.cookId,
    isDeleted: false,
  });

  if (!verifyCook) {
    throw new AppError(
      HttpStatus.NOT_FOUND,
      "Cook verification data not found",
    );
  }

  const quizResult = await QuizCookResultModel.create({
    cookId: updateUser?.cookId,
    quizId,

    totalQuestions: quiz.length,
    correctAnswers: score,
    wrongAnswers: quiz.length - score,
    results,

    verifyCookInfo: {
      ownerName: verifyCook.ownerName,
      businessNumber: verifyCook.businessNumber,
      validIdType: verifyCook.validIdType,
      validIdUrl: verifyCook.validIdUrl,
      selfIdType: verifyCook.selfIdType,
      selfIdUrl: verifyCook.selfIdUrl,
      status: "pending",
      isDeleted: verifyCook.isDeleted,
    },
  });

  // 6️⃣ Final response
  return {
    totalQuestions: quiz.length,
    correctAnswers: score,
    wrongAnswers: quiz.length - score,
    results,
    user: updateUser,
    quizResultId: quizResult._id,
  };
};

export const courseServices = {
  addCourse,
  getCourses,
  addQuizes,
  submitQuiz,
};
