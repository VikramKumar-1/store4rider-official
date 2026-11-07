import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.resolve(process.cwd(), '../backend/.env') });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Brand aliases mapping for flexible search and slug resolution
const BRAND_ALIASES: Record<string, string[]> = {
  'mt-helmets': ['mt', 'mt-helmet', 'mthelmets', 'mt-helmets-india'],
  'ls2-helmets': ['ls2', 'ls2-helmet', 'ls2helmets', 'ls2-helmets-india'],
  'axxis-helmets': ['axxis', 'axxis-helmet', 'axxishelmets'],
  'smk-helmets': ['smk', 'smk-helmet', 'smkhelmets'],
  'axor-helmets': ['axor', 'axor-helmet', 'axorhelmets'],
  'thh-helmets': ['thh', 'thh-helmet'],
  'amaroq-motorcycle-boots': ['amaroq', 'amaroq-boots', 'amaroq-motorcycle-boot'],
  'bobo-gears': ['bobo', 'bobo-gear'],
  'bluarmor': ['blu-armor', 'bluearmor', 'bluarmour'],
  'clan-shoes': ['clan', 'clan-shoe'],
  'cramster': ['cramster-gear'],
  'rynox-gear': ['rynox', 'rynox-gears'],
  'raida-gears': ['raida', 'raida-gear'],
  'biking-brotherhood': ['bbg', 'biking-brotherhood-gears'],
  'forma-boots': ['forma', 'forma-boot'],
  'mototech-gear': ['mototech', 'mototech-gears'],
  'safe-tech-protectors': ['safe-tech', 'safetech'],
  'scala-gears': ['scala', 'scala-gear'],
  'ngk-spark-plugs': ['ngk'],
  'k-n-bike-air-filter': ['kn', 'k&n', 'k-and-n'],
  'bmc-air-filter': ['bmc'],
  'pro-spec-performance-parts': ['pro-spec', 'prospec'],
  'maddog': ['mad-dog', 'maddog-lights'],
  'race-dynamics': ['powertronic'],
  'tvs-racing-performance-gear': ['tvs-racing', 'tvs'],
  'vesrah-brake-pads': ['vesrah'],
  'royal-enfield': ['re', 'royal-enfield-gear'],
  'red-rooster': ['red-rooster-performance'],
  'motorex': ['motorex-oil'],
  'mototrendz': ['mototrendz-india'],
  'moto-vanguard': ['motovanguard'],
  '66bhp': ['66-bhp'],
  'autostreet': ['auto-street'],
  'blueburns': ['blue-burns'],
  'inline-4': ['inline4'],
  'sas-tec': ['sastec'],
  'shad': ['shad-luggage', 'shad-cases'],
};

async function syncAll() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');

  await mongoose.connect(uri);
  console.log('Connected to MongoDB Atlas');

  const Brand = mongoose.connection.collection('brands');
  const Category = mongoose.connection.collection('categories');
  const Product = mongoose.connection.collection('products');

  // Load dumps
  const magentoBrands: any[] = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), '../all-magento-brands.json'), 'utf8')
  );
  const magentoCategories: any[] = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), '../all-magento-categories.json'), 'utf8')
  );

  console.log(`Loaded ${magentoBrands.length} Magento brands and ${magentoCategories.length} categories.`);

  // ---------------------------------------------------------
  // 1. SYNC ALL BRANDS
  // ---------------------------------------------------------
  console.log('\n=================== 1. SYNCING BRANDS ===================');
  let brandsCreated = 0;
  let brandsUpdated = 0;

  for (const b of magentoBrands) {
    const rawSlug = b.urlKey ? slugify(b.urlKey) : slugify(b.name);
    const brandName = b.name.trim();

    // Determine clean logo URL
    let logoUrl = '';
    if (b.thumbnail) {
      if (b.thumbnail.startsWith('wysiwyg/')) {
        logoUrl = `https://www.store4riders.com/media/${b.thumbnail}`;
      } else {
        logoUrl = `https://www.store4riders.com/media/codazon_cache/brand/120x120/${b.thumbnail}`;
      }
    }

    // Check if products exist for this brand in DB
    const escapedName = brandName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const prodCount = await Product.countDocuments({
      $or: [
        { brand: { $regex: new RegExp(`^${escapedName}$`, 'i') } },
        { 'attributes.brand': { $regex: new RegExp(`^${escapedName}$`, 'i') } },
        { name: { $regex: new RegExp(`\\b${escapedName}\\b`, 'i') } }
      ]
    });

    const isBrandActive = prodCount > 0 ? true : Boolean(b.isActive);
    const aliases = BRAND_ALIASES[rawSlug] || [];

    // Find existing by slug or name
    const existing = await Brand.findOne({
      $or: [
        { slug: rawSlug },
        { name: { $regex: new RegExp(`^${escapedName}$`, 'i') } }
      ]
    });

    const brandPayload: any = {
      name: brandName,
      slug: existing?.slug || rawSlug,
      aliases: Array.from(new Set([...(existing?.aliases || []), ...aliases, rawSlug])),
      isActive: isBrandActive,
      showInMenu: true,
      menuGroup: 'Popular Brands',
      metaTitle: b.metaTitle || existing?.metaTitle || `Buy ${brandName} Products Online | Store4Riders`,
      metaDescription: b.metaDescription || existing?.metaDescription || `Explore official ${brandName} motorcycle gear and accessories at Store4Riders. Genuine products with warranty.`,
      metaKeywords: b.metaKeywords || existing?.metaKeywords || `${brandName.toLowerCase()}, ${brandName.toLowerCase()} india, store4riders`,
      updatedAt: new Date()
    };

    if (logoUrl) {
      brandPayload.logo = logoUrl;
    }

    if (b.description && b.description.trim()) {
      brandPayload.description = b.description.trim();
    } else if (!existing?.description) {
      brandPayload.description = `<p>Explore authentic ${brandName} motorcycle products, riding gear, and accessories at Store4Riders. Official warranty and express delivery across India.</p>`;
    }

    if (existing) {
      await Brand.updateOne({ _id: existing._id }, { $set: brandPayload });
      brandsUpdated++;
    } else {
      brandPayload.createdAt = new Date();
      await Brand.insertOne(brandPayload);
      brandsCreated++;
      console.log(`+ Created Brand: "${brandName}" (slug: ${rawSlug}, active: ${isBrandActive}, prods: ${prodCount})`);
    }
  }

  // Remove dummy "Test" brand if present and has 0 products
  await Brand.deleteOne({ slug: 'test' });

  console.log(`Brands Sync Finished: ${brandsCreated} created, ${brandsUpdated} updated.`);

  // ---------------------------------------------------------
  // 2. LINK PRODUCTS TO BRANDS
  // ---------------------------------------------------------
  console.log('\n=================== 2. LINKING PRODUCTS TO BRANDS ===================');
  const allDbBrands = await Brand.find({}).toArray();
  let productsLinked = 0;

  for (const b of allDbBrands) {
    const escaped = b.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const filter = {
      $or: [
        { brand: { $regex: new RegExp(`^${escaped}$`, 'i') } },
        { 'attributes.brand': { $regex: new RegExp(`^${escaped}$`, 'i') } },
        { brandId: { $exists: false } }
      ],
      $and: [
        {
          $or: [
            { brand: { $regex: new RegExp(`^${escaped}$`, 'i') } },
            { 'attributes.brand': { $regex: new RegExp(`^${escaped}$`, 'i') } },
            { name: { $regex: new RegExp(`\\b${escaped}\\b`, 'i') } }
          ]
        }
      ]
    };

    const res = await Product.updateMany(filter, {
      $set: {
        brand: b.name,
        brandId: b._id
      }
    });

    if (res.modifiedCount > 0) {
      productsLinked += res.modifiedCount;
      console.log(`  Linked ${res.modifiedCount} products to Brand: "${b.name}"`);
    }
  }
  console.log(`Total product-brand associations updated: ${productsLinked}`);

  // ---------------------------------------------------------
  // 3. SYNC REMAINING CATEGORIES
  // ---------------------------------------------------------
  console.log('\n=================== 3. SYNCING REMAINING CATEGORIES ===================');

  // Build existing categories map in Mongo
  const existingCats = await Category.find({}).toArray();
  const catBySlug = new Map<string, any>();
  const catByName = new Map<string, any>();
  const catById = new Map<string, any>();

  existingCats.forEach(c => {
    if (c.slug) catBySlug.set(c.slug.toLowerCase().trim(), c);
    if (c.name) catByName.set(c.name.toLowerCase().trim(), c);
    catById.set(String(c._id), c);
  });

  // Parent resolution helper
  const resolveParentId = (parentIdStr?: string, parentSlugFallback?: string): mongoose.Types.ObjectId | undefined => {
    if (parentIdStr && catById.has(parentIdStr)) {
      return catById.get(parentIdStr)._id;
    }
    if (parentSlugFallback) {
      const clean = parentSlugFallback.toLowerCase().trim();
      if (catBySlug.has(clean)) return catBySlug.get(clean)._id;
    }
    return undefined;
  };

  // Missing categories to insert with proper parent linking
  const remainingCategoriesToSync = [
    {
      name: 'Motorcycle Touring Gear',
      slug: 'motorcycle-touring-gear',
      parentSlug: 'riding-gear',
      magentoId: '258',
      desc: '<p>Explore premium motorcycle touring gear in India. High performance jackets, waterproof pants, touring boots and luggage built for endurance long-distance rides.</p>',
      metaTitle: 'Motorcycle Touring Gear in India | Kit for Long Rides | Store4Riders',
      metaDescription: 'Shop motorcycle touring gear online at Store4Riders. Touring jackets, riding pants, adventure boots, luggage bags and touring accessories.',
    },
    {
      name: 'Rynox Saddle bags | Tank bags | Rynox Tail bags',
      slug: 'rynox-bags',
      parentSlug: 'motorcycle-bags-bike-luggage',
      magentoId: '261',
      desc: '<p>Buy official Rynox motorcycle luggage online at Store4Riders. Premium saddle bags, magnetic & strap tank bags, drybags and tail bags built with rugged materials.</p>',
      metaTitle: 'Buy Rynox Saddlebags, Rynox Tank Bags & Tail Bags | Store4Riders',
      metaDescription: 'Shop official Rynox bike luggage online. Rynox Nomad saddlebags, Navigator tank bags, dry bags and tail bags with all-weather rain covers.',
    },
    {
      name: 'Royal Enfield Helmets',
      slug: 'royal-enfield-helmets',
      parentSlug: 'motorcycle-helmets',
      magentoId: '1410',
      desc: '<p>Official Royal Enfield helmets for motorcyclists. Classic open face, full face and modular helmets crafted for pure motorcycling comfort and safety.</p>',
      metaTitle: 'Buy Royal Enfield Helmet Online | Fast Shipping | Store4Riders',
      metaDescription: 'Shop official Royal Enfield helmets online. MLG 1901, Drifter, Escapade, Street Prime and full face helmets at best prices in India.',
    },
    {
      name: 'Royal Enfield Full Face Helmet',
      slug: 'royal-enfield-full-face-helmet',
      parentSlug: 'full-face-helmets',
      magentoId: '1521',
      desc: '<p>Original Royal Enfield full face helmets offering superior aerodynamic stability, dual visor options, and DOT/ISI certified head protection.</p>',
      metaTitle: 'Buy Royal Enfield Full Face Helmet Online | Store4Riders',
      metaDescription: 'Shop Royal Enfield full face helmets online. Escapade, Drifter and Street series full face helmets with scratch-resistant visors.',
    },
    {
      name: 'TVS XPOD Helmets',
      slug: 'tvs-xpod-helmets',
      parentSlug: 'full-face-helmets',
      magentoId: '1598',
      desc: '<p>Official TVS Racing XPOD helmets engineered for track aggression, high-speed airflow, and ISI certification.</p>',
      metaTitle: 'Buy TVS XPOD Helmet Online | TVS Racing Helmets | Store4Riders',
      metaDescription: 'Shop TVS XPOD full face and open face helmets with race-bred graphics and advanced ventilation system.',
    },
    {
      name: 'SMK Retro Helmet',
      slug: 'smk-retro-helmet',
      parentSlug: 'full-face-helmets',
      magentoId: '2999',
      desc: '<p>Timeless vintage aesthetics paired with modern safety standards. SMK Retro full face helmets feature real leather trim, pinlock visor, and ECE certification.</p>',
      metaTitle: 'Buy SMK Retro Helmets Online | COD & EMI Available | Store4Riders',
      metaDescription: 'Shop classic SMK Retro motorcycle helmets. Vintage styled full face helmets with removable suede interiors and UV resistant visors.',
    },
    {
      name: 'MT Thunder4 SV Helmets',
      slug: 'mt-thunder4-sv-helmets',
      parentSlug: 'full-face-helmets',
      magentoId: '1406',
      desc: '<p>The revolutionary MT Thunder 4 SV helmet compliant with the latest ECE 22.06 safety standard. Features internal sun visor, aerodynamic spoiler and quick release system.</p>',
      metaTitle: 'Buy MT Thunder4 SV Helmets Online | ECE 22.06 Certified | Store4Riders',
      metaDescription: 'Shop MT Thunder 4 SV full face helmets in India. Latest ECE 22.06 certified motorcycle helmets with internal sun visor and Pinlock 100% Max Vision.',
    },
    {
      name: 'KeyChains for Bike',
      slug: 'biker-key-chain',
      parentSlug: 'merchandise',
      magentoId: '246',
      desc: '<p>Cool biker keychains, fabric flight tags, rubber bike keyrings for KTM, Royal Enfield, Yamaha, Honda and Kawasaki enthusiasts.</p>',
      metaTitle: 'Buy Key Chains for Bike Online | Biker Key Rings | Store4Riders',
      metaDescription: 'Explore trendy motorcycle keychains, scratch-free fabric keyrings and metallic bike badges at Store4Riders.',
    },
    {
      name: 'Premium Mesh/Textile Riding Jackets',
      slug: 'premium-mesh-riding-jackets',
      parentSlug: 'riding-jackets',
      magentoId: '159',
      desc: '<p>High-end mesh and textile riding jackets engineered with heavy-duty 600D Cordura, CE Level 2 protectors, and multi-season rain/thermal liners.</p>',
      metaTitle: 'Buy Premium Mesh & Textile Motorcycle Jackets | Store4Riders',
      metaDescription: 'Shop premium mesh and textile motorcycle riding jackets. CE Level 2 armour, ventilated chassis and all-weather liners.',
    },
    {
      name: 'Full Gauntlet Riding Gloves Between Rs.3000-4000',
      slug: 'riding-gloves-between-rs-3000-4000',
      parentSlug: 'full-gauntlet-gloves',
      magentoId: '121',
      desc: '<p>Track-ready full gauntlet leather riding gloves between Rs.3000 to Rs.4000 with TPU knuckle protection, scaphoid sliders, and wrist restraint straps.</p>',
      metaTitle: 'Full Gauntlet Gloves Online Below Rs.4000 | Store4Riders',
      metaDescription: 'Shop full gauntlet riding gloves between Rs.3000 to Rs.4000 offering maximum wrist and palm protection.',
    },
    {
      name: 'Motorcycle Tyres',
      slug: 'motorcycle-tyres',
      parentSlug: undefined,
      magentoId: '177',
      desc: '<p>Premium motorcycle tyres for sportbikes, cruisers, adventure tourers and daily commuters. High grip compound from leading tyre manufacturers.</p>',
      metaTitle: 'Get Premium Quality Bike Tyres | Motorcycle Tyres Online | Store4Riders',
      metaDescription: 'Buy front and rear motorcycle tyres online. Tubeless bike tyres for Royal Enfield, KTM Duke, Dominar, Himalayan, Yamaha and Pulsar.',
    },
    {
      name: 'Bike Front Tyres',
      slug: 'front-tyres',
      parentSlug: 'motorcycle-tyres',
      magentoId: '178',
      desc: '<p>Front motorcycle tyres designed for precision handling, wet braking grip, and high-speed cornering stability.</p>',
      metaTitle: 'Buy Original Bike Front Tyres | Motorcycle Front Tyre | Store4Riders',
      metaDescription: 'Shop motorcycle front tyres online at Store4Riders. High grip radial and bias ply tyres for all bike brands.',
    },
    {
      name: 'Motorcycle Rear Tyres',
      slug: 'motorcycle-rear-tyres',
      parentSlug: 'motorcycle-tyres',
      magentoId: '179',
      desc: '<p>Rear motorcycle tyres offering high mileage, deep tread siping for water evacuation, and maximum traction on dry and wet tarmac.</p>',
      metaTitle: 'Quality Rear Motorcycle Tyres | Bike Rear Tyre Online | Store4Riders',
      metaDescription: 'Shop rear motorcycle tyres for high displacement and commuter motorcycles with doorstep delivery.',
    },
    {
      name: 'Cruiser Tyres',
      slug: 'cruiser-tyres',
      parentSlug: 'motorcycle-tyres',
      magentoId: '206',
      desc: '<p>Heavy-duty cruiser tyres engineered for Royal Enfield Classic, Meteor, Harley Davidson and cruiser motorcycles.</p>',
      metaTitle: 'Buy Cruiser Bike Tyres Online | Store4Riders',
      metaDescription: 'Shop long-lasting cruiser motorcycle tyres with reinforced sidewalls and classic deep tread grooves.',
    },
    {
      name: 'On-Off Road Tyres',
      slug: 'on-off-road-tyres',
      parentSlug: 'motorcycle-tyres',
      magentoId: '207',
      desc: '<p>Dual-sport 50/50 and 80/20 on-off road tyres designed for adventure tourers like Himalayan, Xpulse 200, KTM Adventure and BMW GS.</p>',
      metaTitle: 'Dual Sport & On-Off Road Tyres for Bikes | Store4Riders',
      metaDescription: 'Shop dual-sport adventure tyres with knobby tread blocks for tarmac and off-road trails.',
    },
    {
      name: 'Race Tyres',
      slug: 'race-tyres',
      parentSlug: 'motorcycle-tyres',
      magentoId: '208',
      desc: '<p>Track-oriented radial tyres with soft racing compounds for extreme lean angles and track day performance.</p>',
      metaTitle: 'Track & Race Motorcycle Tyres Online | Store4Riders',
      metaDescription: 'Shop high performance race tyres with ultra-grippy silica compounds for sport motorcycles.',
    },
    {
      name: 'Touring Tyres',
      slug: 'touring-tyres',
      parentSlug: 'motorcycle-tyres',
      magentoId: '209',
      desc: '<p>Long-distance touring tyres formulated for maximum tyre life, heavy loads, and superior wet weather confidence.</p>',
      metaTitle: 'Motorcycle Touring Tyres | Long Distance Bike Tyres | Store4Riders',
      metaDescription: 'Buy touring tyres built for highway endurance and all-weather touring across India.',
    },
    {
      name: 'Road Tyres',
      slug: 'road-tyres',
      parentSlug: 'motorcycle-tyres',
      magentoId: '210',
      desc: '<p>Everyday road tyres providing a balanced mix of durability, wet grip, and agile city commuting response.</p>',
      metaTitle: 'Street & Road Motorcycle Tyres | Store4Riders',
      metaDescription: 'Shop road tyres for daily urban commutes and weekend highway getaways.',
    },
    {
      name: 'HJC CS-15 Helmet India',
      slug: 'hjc-cs-15-helmet-india',
      parentSlug: 'full-face-helmets',
      magentoId: '252',
      desc: '<p>The HJC CS-15 is a competitively priced full-face helmet for riders that value quality and safety. Advanced polycarbonate composite shell provides a lightweight, superior fit.</p>',
      metaTitle: 'Buy HJC CS-15 Helmet in India | Store4Riders',
      metaDescription: 'Shop authentic HJC CS-15 motorcycle helmets with advanced channelling ventilation system and anti-fog shield.',
    },
    {
      name: 'HJC C70 Full Face Helmet',
      slug: 'hjc-c70-full-face-helmet',
      parentSlug: 'full-face-helmets',
      magentoId: '253',
      desc: '<p>The HJC C70 features an internal sun shield with a manual, easy-slide lever mechanism. Advanced polycarbonate shell lightweight, superior fit and comfort using advanced CAD technology.</p>',
      metaTitle: 'Buy HJC C70 Full Face Helmet Online in India | Store4Riders',
      metaDescription: 'Shop HJC C70 full face helmet with drop-down sun visor and Pinlock prepared HJ-20M visor.',
    },
    {
      name: 'HJC i70 Full Face Helmets',
      slug: 'hjc-i70-full-face-helmets',
      parentSlug: 'full-face-helmets',
      magentoId: '254',
      desc: '<p>The HJC i70 is a modern, sleek sport-touring helmet composed of HJC advanced polycarbonate material. Full-face shell is noticeably more compact and lighter than its predecessor.</p>',
      metaTitle: 'Buy HJC i70 Full Face Helmets in India | Store4Riders',
      metaDescription: 'Shop HJC i70 sport touring helmet with wider vision eye port and integrated sun shield.',
    },
    {
      name: 'HJC F70 Helmets',
      slug: 'hjc-f70-helmets',
      parentSlug: 'full-face-helmets',
      magentoId: '255',
      desc: '<p>The HJC F70 combines cutting-edge design with upgraded features. The fiberglass composite shell is lightweight and aerodynamically designed with CAD technology.</p>',
      metaTitle: 'Buy HJC F70 Fiberglass Helmets in India | Store4Riders',
      metaDescription: 'Shop HJC F70 lightweight fiberglass composite helmets with aggressive design and internal sun visor.',
    },
    {
      name: 'HJC RPHA 70 Helmet',
      slug: 'hjc-rpha-70-helmet',
      parentSlug: 'full-face-helmets',
      magentoId: '256',
      desc: '<p>A supreme sport-touring helmet designed for any ride from quick commutes to cross-country touring. The Premium Integrated Matrix (P.I.M. Plus) shell provides enhanced shock-resistant performance.</p>',
      metaTitle: 'Buy HJC RPHA 70 Helmet in India | Store4Riders',
      metaDescription: 'Shop flagship HJC RPHA 70 carbon-glass hybrid full face helmet with emergency cheek pad release system.',
    },
    {
      name: 'Riding Guides & Care',
      slug: 'guides',
      parentSlug: undefined,
      magentoId: '194',
      desc: '<p>Comprehensive buying guides, riding gear maintenance tips, helmet sizing advice, and motorcycle care tutorials from Store4Riders experts.</p>',
      metaTitle: 'Motorcycle Riding Gear Guides & Expert Tips | Store4Riders',
      metaDescription: 'Learn how to choose the right riding gear, maintain your helmet visor, care for leather jackets, and ride safely with expert guides.',
    },
    {
      name: 'Choosing Correct Riding Gear',
      slug: 'choosing-correct-riding-gear',
      parentSlug: 'guides',
      magentoId: '195',
      desc: '<p>A beginner and advanced guide to choosing the correct helmet size, jacket fit, glove protection levels, and riding boots for Indian roads.</p>',
      metaTitle: 'How to Choose Correct Riding Gear | Guide | Store4Riders',
      metaDescription: 'Comprehensive sizing and fitment guide for helmets, riding jackets, pants, boots, and gloves.',
    },
    {
      name: 'Expert Riding Tips',
      slug: 'expert-tips',
      parentSlug: 'guides',
      magentoId: '196',
      desc: '<p>Practical motorcycle touring and track riding tips from seasoned Indian bikers. Highway safety, monsoon riding advice, and emergency prep.</p>',
      metaTitle: 'Expert Motorcycle Riding Tips | Store4Riders',
      metaDescription: 'Tips and strategies for safe highway touring, cornering, braking, and bad weather motorcycle riding.',
    },
    {
      name: 'Riding Gear Care & Maintenance',
      slug: 'riding-gear-care',
      parentSlug: 'guides',
      magentoId: '197',
      desc: '<p>How to wash your riding jacket, clean and lube helmet visors, protect leather riding gloves from fungus, and prolong riding boot lifespan.</p>',
      metaTitle: 'Riding Gear Care & Washing Guide | Store4Riders',
      metaDescription: 'Step-by-step cleaning and maintenance instructions for motorcycle helmets, textile gear, leather and waterproof apparel.',
    }
  ];

  let catsCreated = 0;
  let catsUpdated = 0;

  for (const catDef of remainingCategoriesToSync) {
    const existing = await Category.findOne({
      $or: [
        { slug: catDef.slug },
        { name: catDef.name }
      ]
    });

    const parentId = resolveParentId(undefined, catDef.parentSlug);

    const payload: any = {
      name: catDef.name,
      slug: catDef.slug,
      description: catDef.desc,
      metaTitle: catDef.metaTitle,
      metaDescription: catDef.metaDescription,
      metaKeywords: `${catDef.name.toLowerCase()}, store4riders`,
      isActive: true,
      includeInMenu: true,
      parentId: parentId || undefined,
      updatedAt: new Date()
    };

    if (existing) {
      await Category.updateOne({ _id: existing._id }, { $set: payload });
      catsUpdated++;
    } else {
      payload.createdAt = new Date();
      const insertRes = await Category.insertOne(payload);
      // Update in-memory map so children can find it
      catBySlug.set(catDef.slug.toLowerCase().trim(), { _id: insertRes.insertedId, ...payload });
      catByName.set(catDef.name.toLowerCase().trim(), { _id: insertRes.insertedId, ...payload });
      catById.set(String(insertRes.insertedId), { _id: insertRes.insertedId, ...payload });
      catsCreated++;
      console.log(`+ Created Category: "${catDef.name}" (slug: ${catDef.slug}, parent: ${catDef.parentSlug || 'Root'})`);
    }
  }

  console.log(`Categories Sync Finished: ${catsCreated} created, ${catsUpdated} updated.`);

  // ---------------------------------------------------------
  // 4. BACKFILL PRODUCT CATEGORY ASSOCIATIONS
  // ---------------------------------------------------------
  console.log('\n=================== 4. BACKFILLING PRODUCT CATEGORY ASSOCIATIONS ===================');
  let productsCategorized = 0;

  for (const catDef of remainingCategoriesToSync) {
    const searchRegex = new RegExp(catDef.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    const slugRegex = new RegExp(catDef.slug, 'i');

    const filter = {
      categorySlugs: { $ne: catDef.slug },
      $or: [
        { name: searchRegex },
        { magentoCategories: searchRegex },
        { magentoCategories: slugRegex }
      ]
    };

    const res = await Product.updateMany(filter, {
      $addToSet: {
        categorySlugs: catDef.slug
      }
    });

    if (res.modifiedCount > 0) {
      productsCategorized += res.modifiedCount;
      console.log(`  Added category "${catDef.slug}" to ${res.modifiedCount} products.`);
    }
  }

  console.log(`Total category-product associations added: ${productsCategorized}`);

  console.log('\n=================== COMPLETE AUDIT FINISHED ===================');
  process.exit(0);
}

syncAll().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
