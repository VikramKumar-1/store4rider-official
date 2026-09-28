/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: [
    "bullmq",
    "ioredis",
    "node-cron",
    "mongoose",
    "pino",
    "pino-pretty",
    "@aws-sdk/client-s3",
    "@aws-sdk/client-ses",
    "@aws-sdk/s3-request-presigner",
    "bcryptjs",
    "jsonwebtoken",
    "rate-limiter-flexible",
    "swagger-jsdoc",
    "meilisearch",
    "csv-parser",
    "papaparse",
    "pdfkit",
    "fontkit",
    "restructure"
  ],
  // Framework-level CORS headers as safety net for all API routes.
  // The route handler's applyCors() is the primary mechanism — this ensures
  // browsers never see a response without CORS headers even during unhandled crashes.
  async headers() {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Origin", value: frontendUrl },
          { key: "Access-Control-Allow-Methods", value: "GET, POST, PUT, PATCH, DELETE, OPTIONS" },
          { key: "Access-Control-Allow-Headers", value: "Content-Type, Authorization, x-request-id, idempotency-key, Idempotency-Key, Accept, Cache-Control, X-Requested-With, Pragma" },
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Max-Age", value: "86400" },
        ],
      },
    ];
  },
};

export default nextConfig;
