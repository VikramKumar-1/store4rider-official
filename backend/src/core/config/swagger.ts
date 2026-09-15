import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Store4Riders Enterprise API",
      version: "1.0.0",
      description: `
Welcome to the internal API documentation for **Store4Riders**.

🤖 **Need Help?** [Click here to open the AI Assistant Dashboard](/docs/ai) to chat with the built-in AI about these APIs.

## 🚀 Quick Start Guide

## 🔐 How to Login & Get Token

If you want to test protected APIs like **Cart**, **Orders**, or **Wishlist**, you need a token. Follow these steps:

1. **Register (First Time Only):**
   - Click on [POST /auth/register](#/operations/authRegister) from the left menu.
   - On the right panel, you will see a built-in testing tool (API Client). Fill in dummy details (Name, Email, Password) and click **Test Request**.
   - ⚠️ **IMPORTANT:** *Ek email se sirf ek baar register ho sakta hai! Agar aap same email dobara daloge toh error aayega. Agar pehle kar chuke ho, toh sidha Login par jao.*
2. **Login:**
   - Go to [POST /auth/login](#/operations/authLogin).
   - Right panel mein wahi email aur password daaliye aur **Test Request** dabaiye.
   - In the response below, you will see a long text called \`accessToken\`. Copy it!
3. **Authorize:**
   - Click the **Authentication** tab on the right panel (near Test Request).
   - Paste your copied token in the Bearer Token field. Now you are logged in and can test all locked APIs!

## 📦 How to Test Razorpay Orders Right Here
1. Login (as shown above) and keep your token in the Authentication box.
2. Add an item to your cart via [POST /cart/items](#/operations/addCartItem).
3. Add a shipping address via [POST /user/me/addresses](#/operations/addUserAddress) and copy its \`_id\`.
4. Go to [POST /order](#/operations/createOrder), paste the address ID in the body on the right panel, and click **Test Request**.
5. You will receive a real Razorpay Order ID instantly!
      `,
    },
    servers: [
      {
        url: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1",
        description: "Development Server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    tags: [
      { name: "Auth", description: "Authentication endpoints" },
      { name: "Users", description: "User profile management" },
      { name: "Products", description: "Product catalog" },
      { name: "Cart", description: "Shopping cart" },
      { name: "Orders", description: "Order processing" },
      { name: "Wishlist", description: "User wishlist" },
      { name: "Categories", description: "Product categories" },
      { name: "Coupons", description: "Discount coupons" },
      { name: "Reviews", description: "Product reviews" },
      { name: "Media Uploads", description: "S3 uploads" }
    ],
  },
  // Automatically scan all route files in the modules directory for JSDoc comments
  apis: ["./src/modules/**/*.route.ts", "./src/app/api/**/*.ts"],
};

export const getSwaggerSpec = () => swaggerJsdoc(options);
