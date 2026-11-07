const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

async function fix() {
  await mongoose.connect(process.env.MONGODB_URI);
  await mongoose.connection.db.collection('products').updateMany(
    { thumbnail: { $regex: 'no_selection' } },
    { $set: { thumbnail: '/no-image.svg' } }
  );
  console.log('Fixed no_selection thumbnails in DB cleanly!');
  await mongoose.disconnect();
}
fix().catch(console.error);
