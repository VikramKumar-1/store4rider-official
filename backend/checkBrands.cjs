const mongoose = require('mongoose');

const uri = "mongodb+srv://japamic979_db_user:d3X5fxfCo5wBPeCr@store4riders.fg8q7zs.mongodb.net/store4riders";

async function run() {
  try {
    await mongoose.connect(uri);
    const db = mongoose.connection.db;
    const brands = await db.collection('brands').find({}).toArray();
    console.log(brands.map(b => ({name: b.name, logo: b.logo})));
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
  }
}

run();
