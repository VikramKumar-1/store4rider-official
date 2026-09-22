import { ApiResponse } from "../../core/response/ApiResponse";
import { SearchService } from "./search.service";
import { SearchValidator } from "./search.validator";
import { ValidationError } from "../../core/errors/AppError";

export class SearchController {
  static async suggest(req: Request) {
    const url = new URL(req.url);
    const q = url.searchParams.get("q");

    const validated = SearchValidator.suggestQuery.safeParse({ q });
    if (!validated.success) {
      throw new ValidationError("Invalid search query");
    }

    const data = await SearchService.suggest(validated.data.q);
    return ApiResponse.success(data, "Suggestions fetched successfully", 200);
  }
}
