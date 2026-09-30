const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://japamic979_db_user:d3X5fxfCo5wBPeCr@store4riders.fg8q7zs.mongodb.net/store4riders')
  .then(async () => {
    const Product = mongoose.model('Product', new mongoose.Schema({}, {strict: false}), 'products');
    const p = await Product.findOne({name: /CLAN SCOUT WATERPROOF/i});
    if (p) {
      console.log('Keys:', Object.keys(p.toObject()));
      console.log('Any size fields?');
      Object.keys(p.toObject()).forEach(k => {
        if (k.toLowerCase().includes('size')) console.log(k, typeof p[k]);
      });
      console.log('Any chart fields?');
      Object.keys(p.toObject()).forEach(k => {
        if (k.toLowerCase().includes('chart')) console.log(k, typeof p[k]);
      });
      console.log('Attributes:', p.attributes);
    }
    process.exit(0);
  });
