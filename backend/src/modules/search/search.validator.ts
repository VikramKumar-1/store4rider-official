import { z } from "zod";
import {
  createSearchRedirectSchema,
  updateSearchRedirectSchema,
} from "@store4riders/shared-validation";

export class SearchValidator {
  static suggestQuery = z.object({
    q: z.string().min(1, "Search query cannot be empty").max(100),
  });

  static redirectCheckQuery = z.object({
    q: z.string().min(1, "Search query cannot be empty").max(120),
  });

  static listRedirectsQuery = z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    search: z.string().trim().optional(),
  });

  static createRedirect = createSearchRedirectSchema;
  static updateRedirect = updateSearchRedirectSchema;
}
