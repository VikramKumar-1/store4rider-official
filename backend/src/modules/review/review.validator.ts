import { NextRequest } from "next/server";
import { createReviewSchema } from "@store4riders/shared-validation";
import { extractUserFromAuth } from "../../core/middlewares/auth";
import { ValidationError } from "../../core/errors/AppError";

/**
 * @class ReviewValidator
 * @description Extracts and strictly validates incoming JSON payloads for product reviews.
 */
import { randomUUID } from "crypto";

export class ReviewValidator {
  
  static async validateCreate(req: NextRequest) {
    const body = await req.json();
    const data = createReviewSchema.parse(body);

    if (data.website && data.website.trim().length > 0) {
      throw new ValidationError("Automated bot submission detected.");
    }

    let userId: string | null = null;
    let userName = data.userName?.trim();
    let city = data.city?.trim();

    try {
      userId = extractUserFromAuth(req);
    } catch {
      // User is not authenticated via cookie/bearer token
    }

    if (userId) {
      if (!userName || !city) {
        const { UserModel } = await import("../user/user.model");
        const user = await UserModel.findById(userId).select("firstName lastName email addresses").lean().exec() as any;
        if (user) {
          if (!userName) {
            userName = `${user.firstName || ""} ${user.lastName || ""}`.trim() || user.email?.split("@")[0] || "Verified Customer";
          }
          if (!city && user.addresses?.[0]?.city) {
            city = user.addresses[0].city;
          }
          if (!data.userEmail && user.email) {
            data.userEmail = user.email;
          }
        }
      }
    } else {
      if (!userName) {
        throw new ValidationError("Please provide your Name to leave a review.");
      }
      
      if (data.userEmail && data.userEmail.trim()) {
        userId = `guest:${data.userEmail.toLowerCase().trim()}`;
      } else {
        userId = `guest:${randomUUID()}`;
      }
    }

    if (!city || city.trim().length < 2) {
      throw new ValidationError("Please provide your City.");
    }

    const isVerified = Boolean(userId && !userId.startsWith("guest:"));

    return { 
      userId, 
      data: {
        ...data,
        userName: userName || (isVerified ? "Verified Rider" : "Rider"),
        city: city.trim(),
        isVerified,
      }
    };
  }
}
