const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://japamic979_db_user:d3X5fxfCo5wBPeCr@store4riders.fg8q7zs.mongodb.net/store4riders')
  .then(async () => {
    const Product = mongoose.model('Product', new mongoose.Schema({}, {strict: false}), 'products');
    const p = await Product.findOne({name: /CLAN SCOUT WATERPROOF/i});
    console.log('Clan Scout:', p ? p.name : 'Not Found');
    if (p) {
      console.log('sizeChart:', !!p.sizeChart);
      console.log('size_chart:', !!p.size_chart);
    }
    process.exit(0);
  });
