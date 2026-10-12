import { NextRequest } from "next/server";
import { ForbiddenError } from "../errors/AppError";
// In a real app we'd fetch the user role from DB or include it in JWT payload
// For this middleware, we assume the JWT payload or a subsequent DB check determines role.

export const checkAdmin = async (userId: string, getUserRole: (id: string) => Promise<string>) => {
  const role = await getUserRole(userId);
  if (role !== "admin" && role !== "super_admin") {
    throw new ForbiddenError("Admin access required");
  }
};
