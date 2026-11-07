import { z } from "zod";
import {
  createSearchRedirectSchema,
  updateSearchRedirectSchema,
} from "@store4riders/shared-validation";

export class SearchValidator {
  /**
   * Sanitizes user search input to prevent NoSQL injection, RegExp injection, and ReDoS attacks.
   */
  static sanitizeSearchTerm(term: string | undefined | null): string {
    if (!term || typeof term !== "string") return "";
    // Remove MongoDB operators ($where, $regex, $, { , }) and null bytes, trim to max 100 chars
    return term
      .replace(/[\0\$\{\}\[\]\<\>\\]/g, "")
      .trim()
      .slice(0, 100);
  }

  static suggestQuery = z.object({
    q: z
      .string()
      .trim()
      .min(1, "Search query cannot be empty")
      .max(100, "Search query too long")
      .transform((val) => SearchValidator.sanitizeSearchTerm(val)),
  });

  static redirectCheckQuery = z.object({
    q: z
      .string()
      .trim()
      .min(1, "Search query cannot be empty")
      .max(120, "Search query too long")
      .transform((val) => SearchValidator.sanitizeSearchTerm(val)),
  });

  static listRedirectsQuery = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    search: z
      .string()
      .trim()
      .max(100)
      .optional()
      .transform((val) => (val ? SearchValidator.sanitizeSearchTerm(val) : undefined)),
  });

  static createRedirect = createSearchRedirectSchema;
  static updateRedirect = updateSearchRedirectSchema;
}
