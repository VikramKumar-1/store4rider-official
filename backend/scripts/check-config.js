const mongoose = require('mongoose');
require('dotenv').config({ path: 'backend/.env' });

async function check() {
  await mongoose.connect(process.env.MONGODB_URI);
  const Category = mongoose.connection.collection('categories');
  const cat = await Category.findOne({ slug: 'riding-gear-for-women' }); // wait, slug mapping!
  console.log("riding-gear-for-women config:", cat?.filterConfig);
  const cat2 = await Category.findOne({ slug: 'women-riding-gear' }); 
  console.log("women-riding-gear config:", cat2?.filterConfig);
  process.exit(0);
}
check();
