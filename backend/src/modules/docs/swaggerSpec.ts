export const openApiSpec = {
  openapi: "3.0.0",
  info: {
    title: "Store4Riders API",
    version: "1.0.0",
    description: "API documentation for Store4Riders Backend",
  },
  servers: [
    {
      url: "/api",
      description: "Local Server",
    },
  ],
  components: {
    securitySchemes: {
      cookieAuth: {
        type: "apiKey",
        in: "cookie",
        name: "accessToken",
      },
    },
  },
  security: [
    {
      cookieAuth: [],
    },
  ],
  paths: {
    "/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  firstName: { type: "string" },
                  lastName: { type: "string" },
                  email: { type: "string" },
                  password: { type: "string" },
                  phone: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          201: { description: "User registered successfully" },
        },
      },
    },
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  email: { type: "string" },
                  password: { type: "string" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "User logged in successfully" },
        },
      },
    },
    "/products": {
      get: {
        tags: ["Product"],
        summary: "List all products",
        responses: {
          200: { description: "Returns a paginated list of products" },
        },
      },
    },
    "/cart": {
      get: {
        tags: ["Cart"],
        summary: "Get current user's cart",
        responses: {
          200: { description: "Returns the cart" },
        },
      },
      post: {
        tags: ["Cart"],
        summary: "Add item to cart",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  productId: { type: "string" },
                  quantity: { type: "number" },
                },
              },
            },
          },
        },
        responses: {
          200: { description: "Item added to cart" },
        },
      },
    },
  },
};
