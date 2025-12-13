/* eslint-disable @typescript-eslint/no-unsafe-function-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  v2 as cloudinary,
  UploadApiOptions,
  UploadApiResponse,
} from "cloudinary";
import multer, { StorageEngine } from "multer";
import path from "path";
import config from "../config";

// Cloudinary config
cloudinary.config({
  cloud_name: config.cloudinary_name,
  api_key: config.cloudinary_api_key,
  api_secret: config.cloudinary_api_secret,
});

// Function to upload files (image, PDF, Word)
export const sendFileToCloudinary = (
  fileBuffer: Buffer,
  fileName: string,
  mimetype: string,
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    if (!fileBuffer) return reject(new Error("Missing file buffer"));
    if (!mimetype) return reject(new Error("Missing mimetype"));

    // Strip extension from the file name
    const nameWithoutExt = path.parse(fileName).name;

    // Check if the file is an image
    if (mimetype.startsWith("image/")) {
      if (Buffer.isBuffer(fileBuffer)) {
        const base64Image = fileBuffer.toString("base64"); // Buffer to base64
        const dataUri = `data:${mimetype};base64,${base64Image}`;

        // Upload image to Cloudinary
        cloudinary.uploader.upload(
          dataUri,
          {
            public_id: nameWithoutExt,
            resource_type: "image",
            type: "upload",
          },
          (error, result) => {
            if (error) return reject(error);
            if (!result) return reject(new Error("No result from Cloudinary"));
            resolve(result);
          },
        );
      } else {
        reject(new Error("Expected a buffer for image upload"));
      }
    }
    // Handle PDF and Word files (raw files)
    else if (
      mimetype === "application/pdf" ||
      mimetype === "application/msword" ||
      mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      if (Buffer.isBuffer(fileBuffer)) {
        // Use upload_stream for raw files (accepts Buffer)
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            public_id: fileName,
            resource_type: "raw",
            type: "upload",
          },
          (error, result) => {
            if (error) return reject(error);
            if (!result) return reject(new Error("No result from Cloudinary"));
            resolve(result);
          },
        );

        // Write the buffer to the upload stream
        uploadStream.end(fileBuffer);
      } else {
        reject(new Error("Expected a buffer for PDF/Word upload"));
      }
    }
    // Handle video files
    else if (mimetype.startsWith("video/")) {
      if (Buffer.isBuffer(fileBuffer)) {
        // Use upload_stream for video files (accepts Buffer)
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            public_id: nameWithoutExt,
            resource_type: "video",
            type: "upload",
          },
          (error, result) => {
            if (error) return reject(error);
            if (!result) return reject(new Error("No result from Cloudinary"));
            resolve(result);
          },
        );

        // Write the buffer to the upload stream
        uploadStream.end(fileBuffer);
      } else {
        reject(new Error("Expected a buffer for video upload"));
      }
    } else {
      reject(new Error("Unsupported file type"));
    }
  });
};

export const convertDocToPDFWithStream = (
  fileBuffer: Buffer,
  fileName: string,
  mimetype: string,
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    if (!fileBuffer) return reject(new Error("Missing file buffer"));
    if (!mimetype) return reject(new Error("Missing mimetype"));

    // Validate buffer size
    if (fileBuffer.length === 0) {
      return reject(new Error("Empty file buffer"));
    }

    // Validate file extension
    const validExtensions = [".doc", ".docx"];
    const fileExtension = path.extname(fileName).toLowerCase();

    if (!validExtensions.includes(fileExtension)) {
      return reject(
        new Error("Invalid file extension. Only .doc and .docx are allowed"),
      );
    }

    // Strip extension from the file name
    const nameWithoutExt = path.parse(fileName).name;

    // Only process Word documents (.doc, .docx) for conversion
    const validMimeTypes = [
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!validMimeTypes.includes(mimetype)) {
      return reject(
        new Error(
          "Unsupported file type. Only Word documents (.doc, .docx) are allowed",
        ),
      );
    }

    // Set options for Cloudinary's Aspose conversion
    const options: UploadApiOptions = {
      public_id: nameWithoutExt, // Use the file name without extension as public ID
      resource_type: "raw", // 'raw' indicates this is a raw file upload (not image or video)
      type: "upload", // Regular upload type
      raw_convert: "aspose", // Trigger Aspose conversion to PDF
      timeout: 30000, // Set a timeout for the conversion
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) {
          console.log("Cloudinary upload error:", error);
          return reject(
            new Error(`Cloudinary conversion failed: ${error.message}`),
          );
        }
        if (!result) {
          return reject(new Error("No result from Cloudinary"));
        }
        resolve(result); // Return the result which includes PDF URL
      },
    );

    // Write the buffer to the upload stream
    uploadStream.end(fileBuffer);
  });
};

// Multer memory storage
const storage: StorageEngine = multer.memoryStorage();
export const upload = multer({
  storage,
  // fileFilter,
});
