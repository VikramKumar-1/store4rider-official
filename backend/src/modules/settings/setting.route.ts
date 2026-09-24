import { SettingController } from "./setting.controller";
import { SettingValidator } from "./setting.validator";
import { checkAdmin } from "../../core/middlewares/admin";
import { extractUserFromAuth } from "../../core/middlewares/auth";
import { UserService } from "../user/user.service";

export async function settingRouter(req: any, routePath: string) {
  const method = req.method;

  if (method === "GET" && routePath === "public") {
    return SettingController.getPublicSettings(req);
  }

  if (method === "GET" && routePath === "") {
    const userId = extractUserFromAuth(req);
    await checkAdmin(userId, UserService.getRole);
    return SettingController.getSettings(req);
  }

  if (method === "PUT" && routePath === "") {
    const userId = extractUserFromAuth(req);
    await checkAdmin(userId, UserService.getRole);
    SettingValidator.validateUpdateSettings(req);
    return SettingController.updateSettings(req);
  }

  return null;
}
