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
  ],
  async headers() {
    return [
      {
        // match all API routes
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: process.env.FRONTEND_URL || "http://localhost:3000" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization" },
        ]
      }
    ]
  }
};

export default nextConfig;
