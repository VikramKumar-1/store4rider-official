const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");
const fs = require("fs");

// Load all possible env files
const envPaths = [
  path.join(__dirname, ".env"),
  path.join(__dirname, "backend/.env"),
  path.join(__dirname, "frontend/.env"),
  path.join(__dirname, "frontend/.env.local"),
];

let SERPAPI_KEY = "";
let MONGODB_URI = "";

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    const parsed = dotenv.parse(fs.readFileSync(envPath));
    if (parsed.SERPAPI_KEY) SERPAPI_KEY = parsed.SERPAPI_KEY;
    if (parsed.MONGODB_URI) MONGODB_URI = parsed.MONGODB_URI;
    if (parsed.DATABASE_URL && !MONGODB_URI) MONGODB_URI = parsed.DATABASE_URL;
  }
}

if (!SERPAPI_KEY) {
  SERPAPI_KEY = process.env.SERPAPI_KEY || "";
}
if (!MONGODB_URI) {
  MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL || "mongodb+srv://japamic979_db_user:d3X5fxfCo5wBPeCr@store4riders.fg8q7zs.mongodb.net/store4riders";
}

if (!SERPAPI_KEY) {
  console.error("❌ SERPAPI_KEY not found in any .env file.");
  process.exit(1);
}

// Define the StoreReview schema
const storeReviewSchema = new mongoose.Schema(
  {
    author: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    date: { type: String, required: true },
    text: { type: String, required: true },
    link: { type: String },
    avatarUrl: { type: String },
    source: { type: String, default: "google" },
    externalId: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const StoreReview = mongoose.models.StoreReview || mongoose.model("StoreReview", storeReviewSchema);

async function fetchAndSaveReviews() {
  try {
    console.log("🚀 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI);
    console.log("✅ Connected to MongoDB.");

    console.log("🔄 Fetching reviews from SerpApi...");
    const url = `https://serpapi.com/search.json?engine=google_maps_reviews&data_id=0x3bc2c00d5a48819f:0xd4b529549919577c&sort_by=newestFirst&api_key=${SERPAPI_KEY}`;
    
    // Use dynamic import for fetch if needed or global fetch
    let data;
    if (typeof fetch !== "undefined") {
      const response = await fetch(url);
      data = await response.json();
    } else {
      // dynamic import node-fetch if available, else we can use https
      const https = require("https");
      data = await new Promise((resolve, reject) => {
        https.get(url, (res) => {
          let body = "";
          res.on("data", (chunk) => body += chunk);
          res.on("end", () => resolve(JSON.parse(body)));
        }).on("error", reject);
      });
    }

    if (!data.reviews || data.reviews.length === 0) {
      console.log("❌ No reviews found in SerpApi response.");
      return;
    }

    const latestReviews = data.reviews.slice(0, 10).map((r) => ({
      author: r.user?.name || "Anonymous",
      rating: r.rating || 5,
      date: r.date || new Date().toISOString(),
      text: r.snippet || "No comment provided.",
      link: r.link || "",
      avatarUrl: r.user?.thumbnail || "",
      source: "google",
      externalId: r.review_id,
      isActive: true,
    }));

    console.log(`✅ Fetched ${latestReviews.length} reviews. Saving to database...`);

    // Clear existing google reviews
    await StoreReview.deleteMany({ source: "google" });

    await StoreReview.insertMany(latestReviews);
    console.log("🎉 Successfully saved 10 latest reviews to the database!");

  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

fetchAndSaveReviews();
