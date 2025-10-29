import nodemailer from "nodemailer";
import config from "../config";

/* eslint-disable @typescript-eslint/no-explicit-any */
export const sendEmail = async (
  to: string,
  subject: string,
  html: any,
  attachments?: any[], // Add attachments parameter
): Promise<{ success: boolean; message: string }> => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const checkEmail = regex.test(to);
  if (!checkEmail) {
    return {
      success: false,
      message: "Invalid email format.",
    };
  }
  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: config.node_mail_email,
        pass: config.node_mail_pass,
      },
    });

    const info = await transporter.sendMail({
      from: `${config.node_mail_email}`,
      to,
      subject,
      text: "",
      html,
      attachments, // Attach the attachments
    });

    console.log("Message sent:", info.messageId);
    return { success: true, message: "Email sent successfully" };
  } catch (error: any) {
    console.error("Email sending failed:", error.message);
    return { success: false, message: error.message || "Email sending failed" };
  }
};
