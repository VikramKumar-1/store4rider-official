/**
 * @file pagination.ts
 * @description Standardized pagination logic for skip/limit and formatting responses.
 */
import { NextRequest } from "next/server";

export const getPaginationOptions = (req: NextRequest, defaultLimit = 10) => {
  const { searchParams } = new URL(req.url);
  
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const limit = Math.max(1, parseInt(searchParams.get("limit") || String(defaultLimit), 10));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
};

export const formatPaginatedResponse = (data: any[], total: number, page: number, limit: number) => {
  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1,
    }
  };
};
