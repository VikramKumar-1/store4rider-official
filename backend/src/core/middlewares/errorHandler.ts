import { NextResponse } from "next/server";
import { AppError } from "../errors/AppError";
import { ApiResponse } from "../response/ApiResponse";
import { logger } from "../utils/logger";

export const errorHandler = (error: unknown): NextResponse => {
  if (error instanceof AppError) {
    if (error.statusCode === 500) {
      logger.error("AppError (500):", error.message);
    }
    return ApiResponse.error(error.message, error.statusCode);
  }

  // Zod validation errors, if thrown manually or via interceptor
  if (error instanceof Error && error.name === "ZodError") {
    return ApiResponse.error(JSON.parse(error.message), 400);
  }

  logger.error("Unhandled Exception:", error);
  const msg = error instanceof Error ? error.message : "Internal Server Error";
  // Always expose the error message for debugging purposes
  return ApiResponse.error(msg, 500);
};
