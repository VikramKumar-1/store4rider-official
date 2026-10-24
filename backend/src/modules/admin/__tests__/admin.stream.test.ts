import { describe, it, expect, vi, beforeEach } from "vitest";
import { AdminController } from "../admin.controller";
import { NextRequest } from "next/server";
import { UnauthorizedError, ForbiddenError } from "../../../core/errors/AppError";
import * as jwtUtils from "../../../core/utils/jwt";
import { UserService } from "../../user/user.service";

describe("AdminController.getLiveStream - Edge Cases & Security", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("EDGE CASE: rejects request without any auth token with 401 Unauthorized", async () => {
    const req = new NextRequest("http://localhost:4000/api/v1/admin/stream");

    await expect(AdminController.getLiveStream(req)).rejects.toThrow(UnauthorizedError);
  });

  it("EDGE CASE: rejects request with invalid / malformed token", async () => {
    const req = new NextRequest("http://localhost:4000/api/v1/admin/stream", {
      headers: {
        authorization: "Bearer invalid_malformed_token_xyz",
      },
    });

    vi.spyOn(jwtUtils, "verifyToken").mockImplementation(() => {
      throw new Error("jwt malformed");
    });

    await expect(AdminController.getLiveStream(req)).rejects.toThrow();
  });

  it("SECURITY ADVERSARIAL: customer role attempting to access admin live stream must get 403 Forbidden", async () => {
    const req = new NextRequest("http://localhost:4000/api/v1/admin/stream", {
      headers: {
        authorization: "Bearer valid_customer_token",
      },
    });

    vi.spyOn(jwtUtils, "verifyToken").mockReturnValue({ userId: "customer_user_id" } as any);
    vi.spyOn(UserService, "getRole").mockResolvedValue("customer");

    await expect(AdminController.getLiveStream(req)).rejects.toThrow(ForbiddenError);
  });

  it("HAPPY PATH: admin role creates legitimate SSE stream with correct headers", async () => {
    const req = new NextRequest("http://localhost:4000/api/v1/admin/stream", {
      headers: {
        authorization: "Bearer valid_admin_token",
      },
    });

    vi.spyOn(jwtUtils, "verifyToken").mockReturnValue({ userId: "admin_user_id" } as any);
    vi.spyOn(UserService, "getRole").mockResolvedValue("admin");

    const response = await AdminController.getLiveStream(req);

    expect(response).toBeDefined();
    expect(response.headers.get("content-type")).toContain("text/event-stream");
    expect(response.headers.get("cache-control")).toContain("no-cache");
    expect(response.headers.get("x-accel-buffering")).toBe("no");
    expect(response.body).toBeInstanceOf(ReadableStream);
  });

  it("EDGE CASE: token provided in query parameter '?token=...' is accepted for SSE compatibility", async () => {
    const req = new NextRequest("http://localhost:4000/api/v1/admin/stream?token=valid_query_token");

    vi.spyOn(jwtUtils, "verifyToken").mockReturnValue({ userId: "staff_user_id" } as any);
    vi.spyOn(UserService, "getRole").mockResolvedValue("logistic");

    const response = await AdminController.getLiveStream(req);

    expect(response).toBeDefined();
    expect(response.headers.get("content-type")).toContain("text/event-stream");
  });
});
