import { z } from "zod";

export class SearchValidator {
  static suggestQuery = z.object({
    q: z.string().min(1, "Search query cannot be empty").max(100),
  });
}
