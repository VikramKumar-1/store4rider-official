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
  const mailer = getTransporter();
  const FROM_EMAIL = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || "noreply@store4riders.com";

  if (!mailer) {
    logger.warn(`Mocking email to ${to} (Subject: ${subject})`);
    logger.info(`Email HTML Content: \n${html}`);
    return;
  }

  try {
    const info = await mailer.sendMail({
      from: FROM_EMAIL,
      to,
      subject,
      html,
    });
    logger.info(`Email sent to ${to} [Message ID: ${info.messageId}]`);
  } catch (error) {
    logger.error("Failed to send SMTP email", error);
    throw new AppError("Failed to send email", 500);
  }
};
