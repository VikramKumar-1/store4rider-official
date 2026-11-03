import * as nodemailer from "nodemailer";
import { logger } from "../utils/logger";
import { AppError } from "../errors/AppError";

let transporter: nodemailer.Transporter | null = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const SMTP_HOST = process.env.SMTP_HOST || "smtp.gmail.com";
  const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587");
  const SMTP_USER = process.env.SMTP_USER;
  const SMTP_PASS = process.env.SMTP_PASS;

  if (SMTP_USER && SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_PORT === 465, // true for 465, false for other ports
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });
    return transporter;
  }
  return null;
};

export const sendSmtpEmail = async (to: string, subject: string, html: string) => {
  // 1. Primary: Prefer AWS SES when credentials are configured
  const hasSes = !!(process.env.SES_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID);
  if (hasSes) {
    try {
      const { sendEmail } = await import("./ses");
      await sendEmail(to, subject, html);
      logger.info(`Email sent to ${to} via AWS SES`);
      return;
    } catch (sesErr) {
      logger.warn(`AWS SES delivery failed, trying SMTP fallback...`, sesErr);
    }
  }

  // 2. Secondary: Fallback to SMTP if SES fails or is not available
  const mailer = getTransporter();
  const FROM_EMAIL = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || process.env.SES_FROM_EMAIL || "noreply@store4riders.com";

  if (mailer) {
    try {
      const info = await mailer.sendMail({
        from: FROM_EMAIL,
        to,
        subject,
        html,
      });
      logger.info(`Email sent to ${to} via SMTP [Message ID: ${info.messageId}]`);
      return;
    } catch (smtpErr) {
      logger.error("Failed to send SMTP email", smtpErr);
      throw new AppError("Failed to send email", 500);
    }
  }

  throw new AppError("No email provider configured (both AWS SES and SMTP failed)", 500);
};
