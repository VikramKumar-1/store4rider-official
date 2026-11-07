import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || '');
  const Category = mongoose.connection.collection('categories');

  const fullFace = await Category.findOne({ slug: 'full-face-helmets' });
  console.log('full-face-helmets:', fullFace ? { _id: fullFace._id, name: fullFace.name, slug: fullFace.slug } : 'NOT FOUND');

  const catById = await Category.findOne({ _id: new mongoose.Types.ObjectId('6ac9de6835b1b42fa90ac6d3') });
  console.log('Category 6ac9de6835b1b42fa90ac6d3:', catById ? { _id: catById._id, name: catById.name, slug: catById.slug } : 'NOT FOUND');

  // Find all children whose parentId is 6ac9de6835b1b42fa90ac6d3 or fullFace._id
  const targetId = fullFace?._id || new mongoose.Types.ObjectId('6ac9de6835b1b42fa90ac6d3');
  const children = await Category.find({
    $or: [
      { parentId: targetId },
      { parentId: String(targetId) },
      { parentId: fullFace?._id },
      { parentId: String(fullFace?._id) }
    ]
  }).toArray();

  console.log(`\nTotal children of Full Face Helmets in MongoDB: ${children.length}`);
  for (const c of children) {
    console.log(`  - [${c.slug}] "${c.name}"`);
  }

  process.exit(0);
}

run().catch(console.error);
