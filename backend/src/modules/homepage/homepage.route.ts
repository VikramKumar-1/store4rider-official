/**
 * @file homepage.route.ts
 * @description Route handler and Swagger documentation for Homepage and SEO configuration.
 */
import { HomepageController } from "./homepage.controller";
import { checkAdmin } from "../../core/middlewares/admin";
import { extractUserFromAuth } from "../../core/middlewares/auth";
import { UserService } from "../user/user.service";

/**
 * @swagger
 * /api/v1/homepage/public:
 *   get:
 *     summary: Get public homepage and SEO settings
 *     tags: [Homepage]
 *     responses:
 *       200:
 *         description: Homepage configuration successfully fetched
 * 
 * /api/v1/homepage:
 *   get:
 *     summary: Get full homepage configuration (Admin)
 *     tags: [Homepage]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Admin homepage configuration
 *   put:
 *     summary: Update full homepage configuration (Admin)
 *     tags: [Homepage]
 *     security:
 *       - BearerAuth: []
 * 
 * /api/v1/homepage/hero-seo:
 *   put:
 *     summary: Update Hero and SEO configuration (Admin)
 *     tags: [Homepage]
 *     security:
 *       - BearerAuth: []
 * 
 * /api/v1/homepage/sections:
 *   put:
 *     summary: Update Homepage Sections (Admin)
 *     tags: [Homepage]
 *     security:
 *       - BearerAuth: []
 */
export async function homepageRouter(req: any, routePath: string) {
  const method = req.method;

  // GET /homepage/public
  if (method === "GET" && routePath === "public") {
    return HomepageController.getPublic(req);
  }

  // GET /homepage
  if (method === "GET" && (routePath === "" || routePath === "/")) {
    const userId = extractUserFromAuth(req);
    await checkAdmin(userId, UserService.getRole);
    return HomepageController.getAdmin(req);
  }

  // PUT /homepage/hero-seo
  if (method === "PUT" && routePath === "hero-seo") {
    const userId = extractUserFromAuth(req);
    await checkAdmin(userId, UserService.getRole);
    return HomepageController.updateHeroAndSeo(req);
  }

  // PUT /homepage/sections
  if (method === "PUT" && routePath === "sections") {
    const userId = extractUserFromAuth(req);
    await checkAdmin(userId, UserService.getRole);
    return HomepageController.updateSections(req);
  }

  // PUT /homepage
  if (method === "PUT" && (routePath === "" || routePath === "/")) {
    const userId = extractUserFromAuth(req);
    await checkAdmin(userId, UserService.getRole);
    return HomepageController.updateConfig(req);
  }

  return null;
}
