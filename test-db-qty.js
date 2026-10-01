const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://store4riders:Y9BwI020qZq1y7eO@cluster0.z2t58.mongodb.net/store4riders?retryWrites=true&w=majority&appName=Cluster0')
.then(async () => {
  const db = mongoose.connection.db;
  const docs = await db.collection('products').find({sku: 'AASBG-XL-Orange'}).toArray();
  console.log(docs);
  process.exit(0);
});
