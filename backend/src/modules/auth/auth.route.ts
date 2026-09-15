import { NextRequest, NextResponse } from "next/server";
/**
 * @file auth.route.ts
 * @description Defines API endpoints for Authentication and maps them to Controller methods.
 */
import { AuthController } from "./auth.controller";
import { checkRateLimit } from "../../core/middlewares/rateLimiter";

export async function authRouter(req: NextRequest, routePath: string[]): Promise<NextResponse | null> {
  const method = req.method;
  const pathLen = routePath.length;
  const ip = req.headers.get("x-forwarded-for") || "127.0.0.1";

  if (method === "POST" && pathLen === 1) {
    const action = routePath[0];

    /**
     * @swagger
     * /auth/login:
     *   post:
     *     summary: Login user
     *     operationId: authLogin
     *     description: |
     *       ### 🔐 What is this API?
     *       Authenticates a user using their Email and Password. Returns a JSON Web Token (JWT) required to access protected routes.
     *       
     *       ### ⚙️ How it works?
     *       1. Uses **Zod** to validate the email format.
     *       2. Looks up the user in **MongoDB**.
     *       3. Uses `bcrypt` to compare the hashed password securely.
     *       4. Issues a cryptographically signed **JWT Access Token**.
     *       
     *       ### 🧪 How to test?
     *       1. Provide your registered email and password in the body on the right.
     *       2. Click **"Send API Request"**.
     *       3. Copy the `accessToken` from the response!
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               email:
     *                 type: string
     *                 example: user@example.com
     *               password:
     *                 type: string
     *                 example: password123
     *     responses:
     *       200:
     *         description: Logged in successfully
     */
    if (action === "login") {
      await checkRateLimit(ip);
      return await AuthController.login(req);
    }
    
    /**
     * @swagger
     * /auth/register:
     *   post:
     *     summary: Register a new user
     *     operationId: authRegister
     *     description: |
     *       ### 👤 What is this API?
     *       Registers a brand new user into the database.
     *
     *       ### ⚠️ IMPORTANT: HOW TO TEST
     *       Look at the **"Body"** section on the right side. That JSON code box is **EDITABLE**!
     *       1. Click inside the black JSON box on the right.
     *       2. **Change the email address** (e.g. `test1@example.com`, `test2@example.com`).
     *       3. Click **"Send API Request"**.
     *       
     *       **Note:** If you click "Send" multiple times without changing the email, you will get a **409 Conflict Error** because that email is already registered. If you already registered, go to the Login API instead!
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               firstName:
     *                 type: string
     *                 example: John
     *               lastName:
     *                 type: string
     *                 example: Doe
     *               email:
     *                 type: string
     *                 example: newuser@example.com
     *               password:
     *                 type: string
     *                 example: SecurePass!123
     *               phone:
     *                 type: string
     *                 example: "1234567890"
     *     responses:
     *       201:
     *         description: Registered successfully
     */
    if (action === "register") {
      await checkRateLimit(ip);
      return await AuthController.register(req);
    }
    
    /**
     * @swagger
     * /auth/refresh:
     *   post:
     *     summary: Refresh access token
     *     tags: [Auth]
     *     requestBody:
     *       required: true
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               refreshToken:
     *                 type: string
     *     responses:
     *       200:
     *         description: Token refreshed
     */
    if (action === "refresh") {
      return await AuthController.refresh(req);
    }
    
    /**
     * @swagger
     * /auth/logout:
     *   post:
     *     summary: Logout user
     *     tags: [Auth]
     *     security:
     *       - bearerAuth: []
     *     responses:
     *       200:
     *         description: Logged out
     */
    if (action === "logout") {
      return await AuthController.logout(req);
    }
  }

  return null;
}
