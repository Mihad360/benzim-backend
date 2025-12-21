/* eslint-disable @typescript-eslint/no-unused-vars */
import HttpStatus from "http-status";
import AppError from "../../erros/AppError";
import { JwtPayload } from "../../interface/global";
import HygieneComplianceModel from "./hygieneCompliance.model";
import { sendFileToCloudinary } from "../../utils/sendImageToCloudinary";

const uploadHygieneFile = async (
  files: Express.Multer.File[], // Accepts multiple files
  user: JwtPayload, // User payload for user identification
) => {
  // Ensure there are files
  if (!files || files.length === 0) {
    throw new AppError(HttpStatus.NOT_FOUND, "No files uploaded.");
  }

  const uploadedFiles = [];

  // eslint-disable-next-line prefer-const
  for (let file of files) {
    const fileBuffer = file.buffer;
    const fileName = file.originalname;
    const mimetype = file.mimetype;

    let documentUrl: string;

    // Only handle PDF files now
    if (mimetype === "application/pdf") {
      // Upload the PDF to Cloudinary
      const result = await sendFileToCloudinary(fileBuffer, fileName, mimetype);
      documentUrl = result.secure_url; // PDF URL after upload
    } else {
      throw new AppError(
        HttpStatus.BAD_REQUEST,
        "Only .pdf files are allowed.",
      );
    }

    // Save the metadata to the database
    const hygieneCompliance = await HygieneComplianceModel.create({
      userId: user.user, // User reference
      documentTitle: fileName,
      documentUrl: documentUrl,
      pagesViewed: 0, // Initialize the pages viewed counter
      isAcknowledged: false, // Set acknowledgment flag to false initially
      acknowledgmentDate: null, // Set acknowledgment date to null initially
    });

    // // Save the record to the database
    // const savedDocument = await hygieneCompliance.save();
    uploadedFiles.push(hygieneCompliance); // Add saved document to the list
  }

  // Return the list of saved documents
  return uploadedFiles;
};

const getHygieneCompliances = async () => {
  const result = await HygieneComplianceModel.find();
  return result;
};

const verifyHygieneCompliance = async () => {};

export const hygieneServices = {
  uploadHygieneFile,
  verifyHygieneCompliance,
  getHygieneCompliances,
};
