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

  static async trending(req: Request) {
    const data = await SearchService.getTrendingSearches();
    return ApiResponse.success(data, "Trending searches fetched successfully", 200);
  }

  /**
   * Public check for single search query redirect
   */
  static async checkRedirect(req: Request) {
    const url = new URL(req.url);
    const rawQ = url.searchParams.get("q") || url.searchParams.get("query");

    if (!rawQ || !rawQ.trim()) {
      return ApiResponse.success({ hasRedirect: false }, "No query provided", 200);
    }

    const validated = SearchValidator.redirectCheckQuery.safeParse({ q: rawQ });
    if (!validated.success || !validated.data.q) {
      return ApiResponse.success({ hasRedirect: false }, "Invalid query", 200);
    }

    const data = await SearchService.resolveRedirect(validated.data.q);
    return ApiResponse.success(data, "Redirect resolved successfully", 200);
  }

  /**
   * Admin: List all configured search redirects
   */
  static async listRedirects(req: Request) {
    const url = new URL(req.url);
    const queryObj = {
      page: url.searchParams.get("page") || 1,
      limit: url.searchParams.get("limit") || 20,
      search: url.searchParams.get("search") || undefined,
    };

    const validated = SearchValidator.listRedirectsQuery.safeParse(queryObj);
    if (!validated.success) {
      throw new ValidationError(validated.error.errors[0]?.message || "Invalid query parameters");
    }

    const { page, limit, search } = validated.data;
    const { items, totalCount } = await SearchService.listRedirects(page, limit, search);
    return ApiResponse.paginated(items, totalCount, page, limit);
  }

  /**
   * Admin: Get single search redirect by ID
   */
  static async getRedirectById(id: string) {
    const item = await SearchService.getRedirectById(id);
    return ApiResponse.success(item, "Search redirect fetched successfully", 200);
  }

  /**
   * Admin: Create new search redirect rule
   */
  static async createRedirect(req: Request) {
    let body: any;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("Invalid JSON body");
    }

    const validated = SearchValidator.createRedirect.safeParse(body);
    if (!validated.success) {
      throw new ValidationError(validated.error.errors[0]?.message || "Invalid search redirect data");
    }

    const created = await SearchService.createRedirect(validated.data);
    return ApiResponse.success(created, "Search redirect created successfully", 201);
  }

  /**
   * Admin: Update search redirect rule
   */
  static async updateRedirect(req: Request, id: string) {
    let body: any;
    try {
      body = await req.json();
    } catch {
      throw new ValidationError("Invalid JSON body");
    }

    const validated = SearchValidator.updateRedirect.safeParse(body);
    if (!validated.success) {
      throw new ValidationError(validated.error.errors[0]?.message || "Invalid search redirect data");
    }

    const updated = await SearchService.updateRedirect(id, validated.data);
    return ApiResponse.success(updated, "Search redirect updated successfully", 200);
  }

  /**
   * Admin: Delete search redirect rule
   */
  static async deleteRedirect(id: string) {
    await SearchService.deleteRedirect(id);
    return ApiResponse.success({ id, deleted: true }, "Search redirect deleted successfully", 200);
  }
}
