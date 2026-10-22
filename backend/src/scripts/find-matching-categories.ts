import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), "backend/.env") });
import mongoose from "mongoose";

async function findCats() {
  await mongoose.connect(process.env.DATABASE_URL!);
  const cats = await mongoose.connection.collection("categories").find({}).project({ name: 1, slug: 1, parentId: 1 }).toArray();
  const searchTerms = ["glove", "boot", "brake", "phone", "filter", "off-road", "women", "top-box", "box", "other", "mount", "switch", "spares"];
  for (const term of searchTerms) {
    const matches = cats.filter(c => c.name.toLowerCase().includes(term) || c.slug.toLowerCase().includes(term));
    console.log(`\nMatches for "${term}":`);
    matches.forEach(m => console.log(`  - ${m.name} (slug: ${m.slug})`));
  }
  await mongoose.disconnect();
}
findCats();
