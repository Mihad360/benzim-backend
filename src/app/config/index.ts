import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.join((process.cwd(), ".env")) });

export default {
  port: process.env.PORT,
  database_url: process.env.DATABASE_URL,
  node_env: process.env.NODE_ENV,
  node_mail_email: process.env.NODE_MAIL_EMAIL,
  node_mail_pass: process.env.NODE_MAIL_PASS,
  cloudinary_name: process.env.CLOUDINARY_NAME,
  cloudinary_api_key: process.env.CLOUDINARY_API_KEY,
  cloudinary_api_secret: process.env.CLOUDINARY_API_SECRET,
  jwt_access_secret: process.env.JWT_ACCESS_SECRET,
  jwt_access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN,
  jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
  jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
  stripe_publishable_key: process.env.STRIPE_PUBLISHABLE_KEY,
  stripe_secret_key: process.env.STRIPE_SECRET_KEY,
  stripe_platform_webhook: process.env.STRIPE_PLATFORM_WEBHOOK_SECRET,
  stripe_connected_webhook: process.env.STRIPE_CONNECTED_WEBHOOK_SECRET,
  twilio_sid: process.env.TWILIO_ACCOUNT_SID,
  twilio_auth_token: process.env.TWILIO_AUTH_TOKEN,
  twilio_number: process.env.TWILIO_PHONE_NUMBER,
  twilio_reciever_number: process.env.TWILIO_RECIEVER_NUMBER,
  // super_admin_password: process.env.SUPER_ADMIN_PASSWORD,
  // bcrypt_salt_rounds: process.env.BCRYPT_SALT_ROUNDS,
  // default_pass: process.env.DEFAULT_PASS,
  // jwt_refresh_secret: process.env.JWT_REFRESH_SECRET,
  // jwt_refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN,
  // reset_pass_ui_link: process.env.RESET_PASS_UI_LINK,
  stripe_client_publishable_key: process.env.STRIPE_CLIENT_PUBLISHABLE_KEY,
  stripe_client_secret_key: process.env.STRIPE_CLIENT_SECRET_KEY,
  stripe_client_webhook_1: process.env.STRIPE_CLIENT_WEBHOOK_1,
  stripe_client_webhook_2: process.env.STRIPE_CLIENT_WEBHOOK_2,
  stripe_client_webhook_3: process.env.STRIPE_CLIENT_WEBHOOK_3,
};
