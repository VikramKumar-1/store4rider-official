import { Worker, Job } from "bullmq";
import { ENV } from "../config/env";
import { logger } from "../utils/logger";
import IORedis from "ioredis";
import fs from "fs";
import csv from "csv-parser";
import { ProductModel } from "../../modules/product/product.model";
import mongoose from "mongoose";
import { CategoryModel } from "../../modules/category/category.model";
import { BrandModel } from "../../modules/brand/brand.model";
import { slugify } from "@store4riders/shared-utils";


const connection = ENV.REDIS_URL ? new IORedis(ENV.REDIS_URL, { maxRetriesPerRequest: null }) : new IORedis({ maxRetriesPerRequest: null });

const KNOWN_FIELDS = new Set([
  "name", "description", "short_description", "url_key", "sku", "price", "special_price",
  "weight", "is_in_stock", "product_type", "categories", "base_image", "additional_images",
  "configurable_variations", "related_skus", "upsell_skus", "crosssell_skus", "qty",
  "status", "product_online", "visibility", "tax_class_name", "brand",
  "meta_title", "meta_keyword", "meta_description", "size_chart", "sizechart", "gender",
  "gender_1", "country_of_manufacture", "country_of_origin", "attribute_set_code", 
  "attribute_set", "configurable_variation_labels", "backorders", "free_shipping",
  "special_from_date", "special_to_date"
]);

export const migrationWorker = new Worker("migrationQueue", async (job: Job) => {
  const { filePath, adminId } = job.data;
  logger.info(`Processing migration job ${job.id} for file ${filePath}`);

  // Connect to mongoose if not connected (Worker might run in separate process depending on setup)
  if (mongoose.connection.readyState === 0) {
    if (!ENV.DATABASE_URL) throw new Error("DATABASE_URL is missing");
    await mongoose.connect(ENV.DATABASE_URL);
  }

  // We will keep track of configurable products and their simple children
  const configurables = new Map<string, any>();
  const simples = new Map<string, any>();
  const categoriesToCreate = new Set<string>();
  const brandsToCreate = new Set<string>();

  // Pass 1: Stream and Parse the CSV
  await new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        const sku = row.sku?.trim();
        if (!sku) return; // Skip empty rows

        if (row.brand) brandsToCreate.add(row.brand.trim());
        if (row.categories) categoriesToCreate.add(row.categories.trim());

        if (row.product_type === "configurable") {
          configurables.set(sku, row);
        } else {
          simples.set(sku, row);
        }
      })
      .on("end", () => {
        logger.info(`CSV parsing complete for job ${job.id}. Found ${configurables.size} configurables and ${simples.size} simples.`);
        resolve(true);
      })
      .on("error", (err) => {
        logger.error(`Error parsing CSV in job ${job.id}:`, err);
        reject(err);
      });
  });

  // PHASE 15.3 & 15.4: AUTO-GENERATE CATEGORIES AND BRANDS
  logger.info(`Extracting Brands & Categories... Found ${brandsToCreate.size} raw brands and ${categoriesToCreate.size} raw category strings.`);
  
  // Create Brands (with normalization & filter for non-brands)
  const INVALID_BRAND_SLUGS = new Set(["honda", "dominar", "radiator", "yamaha", "suzuki", "ktm", "bajaj"]);
  const BRAND_MAP: Record<string, string> = {
    "honda": "Moto Fusion",
    "dominar": "Motospunk",
    "radiator": "Moto Fusion"
  };

  for (let b of brandsToCreate) {
      if (!b) continue;
      const lower = b.trim().toLowerCase();
      if (BRAND_MAP[lower]) {
        b = BRAND_MAP[lower];
      } else if (INVALID_BRAND_SLUGS.has(lower)) {
        continue;
      }
      const slug = slugify(b);
      await BrandModel.updateOne({ slug }, { $set: { name: b, slug, isActive: true } }, { upsert: true });
  }

  // Create Categories (Hierarchical)
  for (const catStr of categoriesToCreate) {
      if (!catStr) continue;
      // catStr might be "Default Category/Riding Gear/Helmets/Full Face"
      const paths = catStr.split(","); // Magento separates multiple trees by comma
      
      for (const singlePath of paths) {
        const parts = singlePath.split("/").map(p => p.trim()).filter(Boolean);
        
        let parentId: string | null = null;
        let currentSlug = "";
        
        for (const p of parts) {
            if (p === "Default Category" || p === "Root Catalog") continue;
            
            // Build the absolute hierarchical slug so "Helmets" under "Riding Gear" 
            // doesn't clash with "Helmets" under "Bicycles"
            currentSlug = currentSlug ? `${currentSlug}-${slugify(p)}` : slugify(p);
            
            const cat: any = await CategoryModel.findOneAndUpdate(
                { slug: currentSlug },
                { $set: { name: p, slug: currentSlug, parentId: parentId || null } },
                { upsert: true, new: true }
            );
            
            if (cat && cat._id) {
              parentId = cat._id.toString();
            }
        }
      }
  }
  logger.info(`Successfully generated hierarchical category tree and brands from CSV!`);

  // Helper: map a raw row to our IProduct shape
  const mapRowToProduct = (row: any) => {
    const attributes: Record<string, string> = {};
    
    // Scoop all unknown fields into attributes
    for (const [key, value] of Object.entries(row)) {
      if (!KNOWN_FIELDS.has(key) && value && String(value).trim() !== "") {
        attributes[key] = String(value).trim();
      }
    }

    // Process Images
    const images = [];
    const s3BaseUrl = `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/catalog/product`;
    
    const formatImageUrl = (url: string) => {
      url = url.trim();
      if (!url) return null;
      if (url.startsWith("http")) return url; // Already full URL
      // If it starts with /, we append it to the Magento media folder in S3
      return url.startsWith("/") ? `${s3BaseUrl}${url}` : `${s3BaseUrl}/${url}`;
    };

    if (row.base_image && row.base_image.trim() !== "") {
      const formattedUrl = formatImageUrl(row.base_image);
      if (formattedUrl) images.push({ url: formattedUrl });
    }
    if (row.additional_images && row.additional_images.trim() !== "") {
      const extraUrls = row.additional_images.split(",").map((i: string) => formatImageUrl(i)).filter(Boolean);
      extraUrls.forEach((url: string) => images.push({ url }));
    }

    // Prepare arrays
    const categorySlugs = row.categories ? row.categories.split(",").map((c: string) => c.trim()).filter(Boolean) : [];
    const relatedSkus = row.related_skus ? row.related_skus.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
    const upsellSkus = row.upsell_skus ? row.upsell_skus.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
    const crosssellSkus = row.crosssell_skus ? row.crosssell_skus.split(",").map((s: string) => s.trim()).filter(Boolean) : [];

    // Parse numbers safely
    const basePrice = parseFloat(row.price) || 0;
    const specialPrice = row.special_price ? parseFloat(row.special_price) : undefined;
    const weight = row.weight ? parseFloat(row.weight) : undefined;
    const stockStatus = row.is_in_stock ? parseInt(row.is_in_stock) : 0;
    const qty = row.qty ? parseInt(row.qty) : 0;

    // Map Magento specific text fields explicitly to avoid them getting dumped in attributes
    const sizeChart = row.size_chart || row.sizechart || "";
    const gender = row.gender || row.gender_1 || "";
    const countryOfManufacture = row.country_of_manufacture || row.country_of_origin || "";
    const attributeSetCode = row.attribute_set_code || row.attribute_set || "";
    const configurableVariationLabels = row.configurable_variation_labels || "";
    const configurableVariations = row.configurable_variations || "";
    const allowBackorders = row.backorders && row.backorders !== "0" ? true : false;
    const isFreeShipping = row.free_shipping === "1" ? true : false;

    return {
      name: row.name || row.sku,
      description: row.description || "",
      shortDescription: row.short_description || "",
      slug: row.url_key || row.sku.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      sku: row.sku,
      basePrice,
      specialPrice,
      specialPriceFromDate: row.special_from_date ? new Date(row.special_from_date) : undefined,
      specialPriceToDate: row.special_to_date ? new Date(row.special_to_date) : undefined,
      weight,
      stockStatus,
      qty,
      allowBackorders,
      isFreeShipping,
      productType: row.product_type || "simple",
      brand: (row.brand && row.brand.toLowerCase() !== "base") ? row.brand : (attributes["brand"] || undefined),
      taxClassName: row.tax_class_name,
      status: ((row.status || row.product_online) === "1" || (row.status || row.product_online)?.toLowerCase() === "enabled") ? "published" : "draft",
      visibility: row.visibility,
      magentoCategories: row.categories,
      metaTitle: row.meta_title || "",
      metaKeywords: row.meta_keyword || "",
      metaDescription: row.meta_description || "",
      sizeChart,
      size_chart: sizeChart,
      gender,
      countryOfManufacture,
      attributeSetCode,
      configurableVariationLabels,
      configurableVariations,
      categorySlugs: (() => {
        if (!row.categories) return [];
        const parts = row.categories.split(/[/,]/); // Split by slash AND comma
        const mapped = new Set<string>();
        
        parts.forEach((p: string) => {
          let slug = p.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
          slug = slug.replace(/^-+|-+$/g, '');
          if (!slug || slug.includes("root-test")) return;
          
          mapped.add(slug);
          
          if (slug.endsWith('helmet')) mapped.add(slug + 's');
          if (slug.endsWith('bag')) mapped.add(slug + 's');
          if (slug.endsWith('jacket')) mapped.add(slug + 's');
          if (slug.endsWith('pant')) mapped.add(slug + 's');
          if (slug.endsWith('glove')) mapped.add(slug + 's');
          if (slug.endsWith('shoe')) mapped.add(slug + 's');
          if (slug.endsWith('boot')) mapped.add(slug + 's');
          if (slug.endsWith('guard')) mapped.add(slug + 's');
          if (slug.endsWith('protector')) mapped.add(slug + 's');
          
          if (slug.includes('full-face')) { mapped.add('full-face-helmets'); mapped.add('full-face-helmet'); }
          if (slug.includes('open-face')) { mapped.add('open-face-helmets'); mapped.add('open-face-helmet'); }
          if (slug.includes('flip-up') || slug.includes('modular')) { mapped.add('flip-up-helmets'); mapped.add('modular-helmets'); }
          if (slug.includes('tail-bag')) { mapped.add('tail-bags'); }
          if (slug.includes('saddle-bag')) { mapped.add('saddle-bags'); }
        });
        return Array.from(mapped);
      })(),
      relatedSkus,
      upsellSkus,
      crosssellSkus,
      images,
      attributes,
      variants: [] as any[]
    };
  };

  // Pass 2: Extract Child SKUs and Map Data
  const childSkus = new Set<string>();
  
  // First, find all child SKUs from configurables
  for (const conf of configurables.values()) {
    const variationsStr = conf.configurable_variations || "";
    let skus: string[] = [];
    
    // Support "sku=SKU-1,size=L|sku=SKU-2,size=M" format
    if (variationsStr.includes("sku=")) {
      const matches = variationsStr.match(/sku=([^,|]+)/g);
      if (matches) {
        skus = matches.map((s: string) => s.split("=")[1].trim());
      }
    } else if (variationsStr) {
      // Support basic comma separated SKUs
      skus = variationsStr.split(",").map((s: string) => s.trim()).filter(Boolean);
    }
    
    skus.forEach((sku: string) => childSkus.add(sku));
  }

  const finalProducts: any[] = [];
  let stats = { totalFound: 0, mapped: 0, skipped: 0 };

  // Map Configurables + their children
  for (const [sku, confRow] of configurables.entries()) {
    const parentProd = mapRowToProduct(confRow);
    
    const variationsStr = confRow.configurable_variations || "";
    let skus: string[] = [];
    if (variationsStr.includes("sku=")) {
      const matches = variationsStr.match(/sku=([^,|]+)/g);
      if (matches) {
        skus = matches.map((s: string) => s.split("=")[1].trim());
      }
    } else if (variationsStr) {
      skus = variationsStr.split(",").map((s: string) => s.trim()).filter(Boolean);
    }

    // Find children from simples map
    for (const childSku of skus) {
      const childRow = simples.get(childSku);
      if (childRow) {
        const childData = mapRowToProduct(childRow);
        parentProd.variants.push({
          sku: childData.sku,
          price: childData.basePrice,
          specialPrice: childData.specialPrice,
          stock: childData.qty || childData.stockStatus,
          attributes: childData.attributes,
          imageUrl: childData.images[0]?.url,
          // DEEP CODING: Exact Magento CSV mapping for Child variants
          weight: childData.weight,
          status: childData.status === "published" ? "enabled" : "disabled",
          visibility: childData.visibility || "Not Visible Individually",
          images: childData.images || []
        });
      }
    }

    // FIX: If the Parent product price is 0 (as is common in Magento configurable products),
    // inherit the price from the lowest priced child variant!
    if (parentProd.basePrice === 0 && parentProd.variants.length > 0) {
      const validPrices = parentProd.variants.map((v: any) => v.price).filter((p: number) => p > 0);
      if (validPrices.length > 0) {
        parentProd.basePrice = Math.min(...validPrices);
      }
      
      if (!parentProd.specialPrice) {
        const validSpecials = parentProd.variants.map((v: any) => v.specialPrice).filter((p: number | undefined) => p && p > 0);
        if (validSpecials.length > 0) {
          parentProd.specialPrice = Math.min(...validSpecials);
        }
      }
    }
    
    finalProducts.push(parentProd);
    stats.mapped++;
  }

  // Map remaining independent Simple products
  for (const [sku, simpRow] of simples.entries()) {
    if (!childSkus.has(sku)) {
      finalProducts.push(mapRowToProduct(simpRow));
      stats.mapped++;
    }
  }

  stats.totalFound = configurables.size + simples.size;
  logger.info(`Mapping complete. Configured ${finalProducts.length} final products to upsert.`);

  // Pass 3: MongoDB BulkWrite with Upsert (Batches of 500)
  const BATCH_SIZE = 500;
  let batchCount = 0;
  let successCount = 0;
  let failCount = 0;
  const errors = [];

  for (let i = 0; i < finalProducts.length; i += BATCH_SIZE) {
    const batch = finalProducts.slice(i, i + BATCH_SIZE);
    
    const ops = batch.map(p => ({
      updateOne: {
        filter: { sku: p.sku },
        update: { $set: p },
        upsert: true
      }
    }));

    try {
      const result = await ProductModel.bulkWrite(ops, { ordered: false });
      successCount += (result.upsertedCount + result.modifiedCount + (result.matchedCount - result.modifiedCount));
      batchCount++;
      
      // Sync the batch to Meilisearch so it appears in the Search Bar!
      try {
        const { indexProduct } = await import("../../core/search/meilisearch");
        // Only index products that are published
        const productsToIndex = batch.filter(p => p.status === "published");
        if (productsToIndex.length > 0) {
          await Promise.all(productsToIndex.map(p => indexProduct({
            _id: p.sku, // For search indexing, we can just use SKU as ID to prevent duplicates
            id: p.sku,
            name: p.name,
            slug: p.slug,
            sku: p.sku,
            basePrice: p.basePrice,
            specialPrice: p.specialPrice,
            categorySlugs: p.categorySlugs,
            brand: p.brand,
            stockStatus: p.stockStatus,
            imageUrl: p.images?.[0]?.url || "",
          } as any)));
        }
      } catch (searchError: any) {
        logger.error(`[Job ${job.id}] Failed to sync batch ${batchCount} to Meilisearch`, searchError.message);
      }
      
      // Report progress to BullMQ
      const progress = Math.round(((i + batch.length) / finalProducts.length) * 100);
      await job.updateProgress(progress);
      
      logger.info(`[Job ${job.id}] Processed batch ${batchCount} (${i + batch.length}/${finalProducts.length})`);
    } catch (error: any) {
      // In ordered: false, if some fail, it continues and throws BulkWriteError at the end of the batch
      logger.error(`[Job ${job.id}] Batch ${batchCount} encountered errors.`, error.message);
      failCount += batch.length; // Approximate, could parse error.writeErrors for exact count
      errors.push({ batch: batchCount, error: error.message });
    }
  }

  // Final reporting
  logger.info(`[Job ${job.id}] Migration Complete! Success: ${successCount}, Failed: ${failCount}`);

  // NUKE REDIS CACHE AT THE END SO FRONTEND UPDATES INSTANTLY!
  try {
    const { clearProductCaches } = await import("../../core/cache/redis");
    await clearProductCaches();
    logger.info(`[Job ${job.id}] Nuked all product caches after bulk upload!`);
  } catch (err: any) {
    logger.warn(`[Job ${job.id}] Failed to clear cache: ${err.message}`);
  }
  
  // Optional: Save audit report to disk or DB
  // fs.writeFileSync(`tmp/migration-report-${job.id}.json`, JSON.stringify({ stats, successCount, failCount, errors }));

  return { success: true, successCount, failCount, errors };
}, { connection });

migrationWorker.on("completed", (job: Job) => {
  logger.info(`Migration job ${job.id} has completed successfully!`);
});

migrationWorker.on("failed", (job: Job | undefined, err: Error) => {
  logger.error(`Migration job ${job?.id} failed with reason: ${err.message}`);
});
