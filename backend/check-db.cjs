const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://japamic979_db_user:d3X5fxfCo5wBPeCr@store4riders.fg8q7zs.mongodb.net/store4riders')
  .then(async () => {
    const Product = mongoose.model('Product', new mongoose.Schema({}, {strict: false}), 'products');
    const p = await Product.findOne({slug: 'agv-k1-s-track-46-helmet'});
    console.log(Object.keys(p.toObject()));
    console.log('sizeChart:', p.sizeChart);
    console.log('size_chart:', p.size_chart);
    console.log('sizeChart01:', p.size_chart_01);
    process.exit(0);
  });
