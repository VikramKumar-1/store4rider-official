import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'backend', '.env.local') });

import { connectToDatabase } from '../src/core/database/connection';
import mongoose from 'mongoose';

function toSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function syncSeoSubcategories() {
  await connectToDatabase();
  const categoryCol = mongoose.connection.collection('categories');
  const productCol = mongoose.connection.collection('products');

  console.log('--- 1. Locating Core Category Parents ---');
  // Find Full Face Helmets parent by exact slug 'full-face-helmets'
  let fullFaceParent = await categoryCol.findOne({ slug: 'full-face-helmets' });
  if (!fullFaceParent) {
    fullFaceParent = await categoryCol.findOne({ slug: 'full-face-helmet' });
  }

  if (!fullFaceParent) {
    console.error('Could not find Full Face Helmets parent category!');
    process.exit(1);
  }
  console.log(`Full Face Helmets Parent: [${fullFaceParent._id}] "${fullFaceParent.name}" (slug: "${fullFaceParent.slug}")`);

  const helmetsParent = await categoryCol.findOne({ slug: 'motorcycle-helmets' });
  if (helmetsParent) {
    await categoryCol.updateOne(
      { _id: fullFaceParent._id },
      { $set: { parentId: String(helmetsParent._id), includeInMenu: true } }
    );
  }

  // 2. Discover all Subcategories under Full Face Helmet from products' magentoCategories
  console.log('--- 2. Scanning products for Full Face Helmet SEO Subcategories ---');
  const products = await productCol.find({
    magentoCategories: { $regex: 'Full Face', $options: 'i' }
  }).project({ _id: 1, name: 1, magentoCategories: 1, categorySlugs: 1 }).toArray();

  console.log(`Found ${products.length} products with Full Face categories.`);

  const subcatProductCounts = new Map<string, number>();

  for (const p of products) {
    const rawPaths = String(p.magentoCategories || '').split(',');
    for (const rawPath of rawPaths) {
      if (rawPath.includes('Full Face')) {
        const segments = rawPath
          .replace(/\\\//g, '__SLASH__')
          .split('/')
          .map(s => s.replace(/__SLASH__/g, '/').trim())
          .filter(Boolean);

        // Find index of "Full Face Helmet"
        const ffIndex = segments.findIndex(s => s.toLowerCase().includes('full face'));
        if (ffIndex !== -1 && segments.length > ffIndex + 1) {
          const subcatName = segments[ffIndex + 1];
          if (subcatName && !subcatName.toLowerCase().includes('root') && !subcatName.toLowerCase().includes('default')) {
            subcatProductCounts.set(subcatName, (subcatProductCounts.get(subcatName) || 0) + 1);
          }
        }
      }
    }
  }

  console.log(`Discovered ${subcatProductCounts.size} SEO Subcategories under Full Face Helmet:`);
  for (const [name, count] of subcatProductCounts.entries()) {
    console.log(`- "${name}" (${count} products)`);
  }

  // 3. Known / Authoritative SEO Slugs mapping
  const SEO_SLUG_MAP: Record<string, string> = {
    'Full Face Helmets Under Rs.4000': 'helmets-below-rs-4000',
    'Best helmets under Rs.5000': 'best-helmets-under-rs-5000',
    'Helmets Between Rs.5000-6000': 'helmets-between-rs-5000-6000',
    'Helmets Between Rs.6000-10000': 'helmets-between-rs-6000-10000',
    'Premium Full Face Helmets': 'premium-full-face-helmets',
    'Carbon Fibre Helmets': 'carbon-fibre-helmets',
    'Axor Apex Dual Visor Full Face Helmets': 'axor-apex-dual-visor-full-face-helmets',
    'Axor Agera Full Face Helmets': 'axor-agera-full-face-helmets',
    'Axor Brutale Dual Spoiler Helmet': 'axor-brutale-dual-spoiler-helmet',
    'Buy SMK Stellar Helmets Online': 'buy-smk-stellar-helmets-online',
    'SMK Typhoon Full Face Touring Helmets': 'smk-typhoon-full-face-touring-helmets',
    'SMK Agnar Helmet: Full-Face Protection with Race-Ready Styling': 'smk-agnar-helmet',
    'SMK Titan helmets': 'smk-titan-helmets',
    'SMK Nova Helmets': 'smk-nova-helmets',
    'LS2 FF800 Storm II Helmets (Touring Range)': 'ls2-ff800-storm-ii-helmets',
    'LS2 FF320 Stream II (Daily Rider Range)': 'ls2-ff320-stream-ii-helmets',
    'Royal Enfield Drifter Helmet': 'royal-enfield-drifter-helmet',
    'Royal Enfield Escapade helmet': 'royal-enfield-escapade-helmet'
  };

  // 4. Upsert each SEO subcategory in MongoDB under Full Face Helmets
  console.log('--- 3. Upserting SEO Subcategories into MongoDB ---');
  const upsertedSubcatMap = new Map<string, string>(); // subcatName -> slug

  for (const [name, count] of subcatProductCounts.entries()) {
    const slug = SEO_SLUG_MAP[name] || toSlug(name);
    upsertedSubcatMap.set(name, slug);

    // Determine group
    let menuGroup = 'SEO / Model';
    if (name.includes('Under ') || name.includes('Between ') || name.includes('Rs.')) {
      menuGroup = 'SEO / Price';
    } else if (name.includes('Carbon') || name.includes('Premium')) {
      menuGroup = 'SEO / Feature';
    }

    // Check if category already exists by slug or name
    const existing = await categoryCol.findOne({
      $or: [
        { slug: slug },
        { name: name }
      ]
    });

    if (existing) {
      await categoryCol.updateOne(
        { _id: existing._id },
        {
          $set: {
            name: name,
            slug: slug,
            parentId: String(fullFaceParent._id),
            includeInMenu: false, // Hidden from storefront navbar megamenu, but active in Admin and SEO
            menuGroup: menuGroup
          }
        }
      );
      console.log(`  Updated existing: "${name}" -> [${existing._id}] (slug: "${slug}", parentId: "${fullFaceParent._id}")`);
    } else {
      const inserted = await categoryCol.insertOne({
        name: name,
        slug: slug,
        parentId: String(fullFaceParent._id),
        includeInMenu: false,
        menuGroup: menuGroup,
        description: `<p>Explore ${name} with certified safety, premium comfort, and top-tier protection.</p>`,
        metaTitle: `${name} | Store4Riders`,
        metaDescription: `Buy ${name} online at best prices in India. Certified safety, fast delivery, COD & EMI available.`,
        faqs: [],
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`  Created new: "${name}" -> [${inserted.insertedId}] (slug: "${slug}", parentId: "${fullFaceParent._id}")`);
    }
  }

  // 5. Backfill products' categorySlugs with these subcategory slugs
  console.log('--- 4. Updating product categorySlugs ---');
  let updatedProductCount = 0;

  for (const p of products) {
    const rawPaths = String(p.magentoCategories || '');
    const currentSlugs = new Set<string>(p.categorySlugs || []);
    let modified = false;

    for (const [name, slug] of upsertedSubcatMap.entries()) {
      if (rawPaths.includes(name)) {
        if (!currentSlugs.has(slug)) {
          currentSlugs.add(slug);
          modified = true;
        }
      }
    }

    if (modified) {
      await productCol.updateOne(
        { _id: p._id },
        { $set: { categorySlugs: Array.from(currentSlugs) } }
      );
      updatedProductCount++;
    }
  }

  console.log(`Successfully updated ${updatedProductCount} products with their SEO subcategory slugs!`);
  console.log('DONE!');
  process.exit(0);
}

syncSeoSubcategories().catch(console.error);
