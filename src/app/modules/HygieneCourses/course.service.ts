import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { sendFileToCloudinary } from "../../utils/sendImageToCloudinary";
import { Course } from "./course.interface";
import CourseModel from "./course.model";
import QueryBuilder from "../../builder/QueryBuilder";
import { UserModel } from "../User/user.model";
import { JwtPayload } from "../../interface/global";
import { Types } from "mongoose";

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

export const courseServices = {
  addCourse,
  getCourses,
};
