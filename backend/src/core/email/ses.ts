import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { logger } from "../utils/logger";
import { AppError } from "../errors/AppError";

const REGION = process.env.SES_REGION || process.env.AWS_REGION || "ap-south-1";
const FROM_EMAIL = process.env.SES_FROM_EMAIL || "noreply@store4riders.com";
const ACCESS_KEY_ID = process.env.SES_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY_ID;
const SECRET_ACCESS_KEY = process.env.SES_SECRET_ACCESS_KEY || process.env.AWS_SECRET_ACCESS_KEY;

let sesClient: SESClient | null = null;

if (ACCESS_KEY_ID && SECRET_ACCESS_KEY) {
  sesClient = new SESClient({
    region: REGION,
    credentials: {
      accessKeyId: ACCESS_KEY_ID,
      secretAccessKey: SECRET_ACCESS_KEY,
    },
  });
} else {
  logger.warn("AWS SES credentials missing. Email sending will fail if triggered.");
}

export const sendEmail = async (to: string, subject: string, body: string) => {
  if (!sesClient) {
    throw new AppError("AWS SES credentials are not configured", 500);
  }

  const isHtml = /<[a-z][\s\S]*>/i.test(body);

  const command = new SendEmailCommand({
    Source: FROM_EMAIL,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject, Charset: "UTF-8" },
      Body: isHtml
        ? {
            Html: { Data: body, Charset: "UTF-8" },
            Text: { Data: body.replace(/<[^>]*>?/gm, ""), Charset: "UTF-8" },
          }
        : {
            Text: { Data: body, Charset: "UTF-8" },
          },
    },
  });

  try {
    const response = await sesClient.send(command);
    logger.info(`Email sent to ${to} (MessageId: ${response.MessageId})`);
    return response;
  } catch (error) {
    logger.error(`Failed to send email to ${to}`, error);
    throw error;
  }
};
