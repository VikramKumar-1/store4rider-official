import { ForbiddenError } from "../errors/AppError";
import { PermissionAction, hasPermission } from "../config/permissions";
import { UserRole } from "@store4riders/shared-types";

export const checkPermission = async (
  userId: string,
  action: PermissionAction,
  getUserRole: (id: string) => Promise<UserRole>
) => {
  const role = await getUserRole(userId);
  
  if (!hasPermission(role, action)) {
    throw new ForbiddenError(`Permission denied. Required action: ${action}`);
  }
};
