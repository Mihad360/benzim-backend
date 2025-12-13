export interface Course {
  title: string;
  description: string;
  fileType: "video" | "pdf" | "quiz";
  fileUrl: string;
  filename: string;
  mimetype: string;
  quizzes: Quiz[]; // Array of quizzes
  createdAt: Date;
  updatedAt: Date;
}

export interface FileMetadata {
  fileUrl: string;
  filename: string;
  mimetype: string;
}

export interface Quiz {
  question: string; // The question text
  questionType: "multiple-choice" | "true-false" | "fill-in-the-blank"; // Type of question
  options: Option[]; // Multiple options for mul tiple-choice questions
  correctAnswer: string;
}

export interface Option {
  optionText: string; // Option text
  isCorrect: boolean; // Whether this option is the correct answer
}
