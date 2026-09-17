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
     *       ### ⚙️ Under The Hood (Architecture & Security)
     *       - **Redis Rate-Limiting:** This endpoint is heavily protected by Redis. If an attacker tries to guess passwords (Brute Force attack), their IP is automatically blocked after a few failed attempts.
     *       - **Zod Validation:** The email payload is strictly sanitized before it ever touches the database, completely preventing NoSQL Injection attacks.
     *       - **Bcrypt Hashing:** Passwords are NEVER stored in plain text. We use industry-standard bcrypt hashing with salt. Even database admins cannot read user passwords.
     *       - **Short-Lived JWT:** The token returned expires in 15 minutes. This minimizes the risk window if a token is ever intercepted.
     *       
     *       ### 🧪 How to test?
     *       1. Provide your registered email and password in the body on the right.
     *       2. Click **"Test Request"**.
     *       3. Copy the `accessToken` from the response to use in the Authorization tab!
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
     *             required:
     *               - firstName
     *               - email
     *               - password
     *             properties:
     *               firstName:
     *                 type: string
     *                 minLength: 2
     *                 maxLength: 50
     *                 description: "First name of the user (Min: 2, Max: 50 characters)"
     *                 example: John
     *               lastName:
     *                 type: string
     *                 maxLength: 50
     *                 description: "Last name of the user (Optional, Max: 50 characters)"
     *                 example: Doe
     *               email:
     *                 type: string
     *                 format: email
     *                 description: "Valid email address. Used for login and communications."
     *                 example: newuser@example.com
     *               password:
     *                 type: string
     *                 minLength: 6
     *                 description: "Strong password (Minimum 6 characters required)"
     *                 example: SecurePass!123
     *               phone:
     *                 type: string
     *                 pattern: "^[0-9]{10}$"
     *                 description: "10-digit mobile number (Optional, numbers only)"
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
