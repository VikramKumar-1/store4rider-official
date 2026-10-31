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
  const FROM_EMAIL = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER || process.env.SES_FROM_EMAIL || "noreply@store4riders.com";

  if (!mailer) {
    // When SMTP credentials are not provided, fallback seamlessly to AWS SES
    try {
      const { sendEmail } = await import("./ses");
      await sendEmail(to, subject, html);
      logger.info(`Email sent to ${to} via AWS SES (SMTP fallback)`);
      return;
    } catch (sesErr) {
      logger.error("Failed to send email via AWS SES", sesErr);
      throw new AppError("Failed to send email", 500);
    }
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
