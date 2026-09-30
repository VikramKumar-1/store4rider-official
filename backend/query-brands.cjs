const mongoose = require("mongoose");

const uri = "mongodb+srv://japamic979_db_user:d3X5fxfCo5wBPeCr@store4riders.fg8q7zs.mongodb.net/store4riders";

const targetBrands = [
  "mt", "mt helmet", "mt helmets",
  "axxis",
  "orazo",
  "xts",
  "korda",
  "macna",
  "scimiatar", "scimitar",
  "vemar",
  "thh",
  "pirelli",
  "metzeler",
  "michelin",
  "vega",
  "acerbis",
  "axo",
  "studds",
  "motorx"
];

async function run() {
  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");
    
    const db = mongoose.connection.db;
    const uniqueBrands = await db.collection("products").distinct("brand");
    
    const brandsToHide = uniqueBrands.filter(b => {
      if (!b) return false;
      const lower = b.toLowerCase().trim();
      if (lower.includes("axor")) return false; // Strictly prohibit Axor
      return targetBrands.some(tb => lower === tb || lower.includes(tb));
    });

    console.log("\nBrands identified for hiding:");
    console.log(brandsToHide);

    const counts = {};
    let total = 0;

    for (const brand of brandsToHide) {
      const count = await db.collection("products").countDocuments({ brand });
      counts[brand] = count;
      total += count;
    }

    console.log("\nCounts per brand:");
    console.log(counts);
    console.log(`\nTotal products to hide: ${total}`);

    // Update the products to status: 'archived'
    const updateResult = await db.collection("products").updateMany(
      { brand: { $in: brandsToHide } },
      { $set: { status: "archived" } }
    );
    
    console.log(`\nSuccessfully hidden (archived) ${updateResult.modifiedCount} products.`);

  } catch (err) {
    console.error(err);
  } finally {
    await mongoose.disconnect();
  }
}

run();
