import { NextRequest } from "next/server";
import { createReviewSchema } from "@store4riders/shared-validation";
import { extractUserFromAuth } from "../../core/middlewares/auth";

/**
 * @class ReviewValidator
 * @description Extracts and strictly validates incoming JSON payloads for product reviews.
 */
export class ReviewValidator {
  
  static async validateCreate(req: NextRequest) {
    const userId = extractUserFromAuth(req);
    const body = await req.json();
    const data = createReviewSchema.parse(body);
    return { userId, data };
  }
}
