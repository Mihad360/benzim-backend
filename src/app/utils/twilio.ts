import twilio from "twilio";
import config from "../config";

const twilioClient = twilio(config.twilio_sid, config.twilio_auth_token);

export const sendOtp = async (to: string, otp: string) => {
  console.log(to);
  try {
    const message = await twilioClient.messages.create({
      body: `Your verification code is: ${otp}`,
      from: config.twilio_number,
      to, // receiver phone number (e.g. +8801XXXXXXXXX)
    });
    console.log(message);
    console.log("✅ OTP sent successfully:", message.sid);
    return message.sid;
  } catch (error) {
    console.error("❌ Failed to send OTP:", error);
    throw error;
  }
};
