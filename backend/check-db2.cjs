const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://japamic979_db_user:d3X5fxfCo5wBPeCr@store4riders.fg8q7zs.mongodb.net/store4riders')
  .then(async () => {
    const Product = mongoose.model('Product', new mongoose.Schema({}, {strict: false}), 'products');
    const p = await Product.findOne({sizeChart: {$exists: true}});
    if (p) { console.log('Found sizeChart:', p.sizeChart); } else { console.log('No sizeChart found'); }
    
    const p2 = await Product.findOne({size_chart: {$exists: true}});
    if (p2) { console.log('Found size_chart:', p2.size_chart); } else { console.log('No size_chart found'); }

    const p3 = await Product.findOne({slug: /rynox/});
    console.log(p3 ? Object.keys(p3.toObject()).filter(k => k.toLowerCase().includes('size')) : 'no rynox found');
    process.exit(0);
  });
