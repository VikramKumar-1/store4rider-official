import { MeiliSearch } from "meilisearch";
import { logger } from "../utils/logger";
import { IProduct } from "@store4riders/shared-types";
import { ProductModel } from "../../modules/product/product.model";

const HOST = process.env.MEILISEARCH_HOST as string;
const KEY = process.env.MEILISEARCH_KEY as string;

if (!HOST || !KEY) {
  logger.error("CRITICAL: MEILISEARCH_HOST or MEILISEARCH_KEY is missing in .env file");
}

export const meiliClient = new MeiliSearch({ host: HOST, apiKey: KEY });

const INDEX_NAME = "products";

/**
 * Transforms a MongoDB product into a flat Meilisearch document
 */
export const transformProductForSearch = (product: any) => {
  // Extract unique sizes and colors from variants for easy filtering
  const sizes = new Set<string>();
  const colors = new Set<string>();
  
  if (product.variants && Array.isArray(product.variants)) {
    product.variants.forEach((v: any) => {
      if (v.attributes) {
        // Handle Map or plain object
        const attrs = v.attributes instanceof Map 
          ? Object.fromEntries(v.attributes) 
          : v.attributes;
          
        if (attrs.size) sizes.add(attrs.size);
        if (attrs.color || attrs.colour) colors.add(attrs.color || attrs.colour);
      }
    });
  }

  return {
    id: product._id.toString(), // Meilisearch requires 'id'
    name: product.name,
    description: product.description,
    slug: product.slug,
    sku: product.sku,
    categoryId: product.categoryId,
    basePrice: product.basePrice,
    specialPrice: product.specialPrice,
    brand: product.brand,
    status: product.status,
    salesCount: product.salesCount,
    createdAt: product.createdAt ? new Date(product.createdAt).getTime() : Date.now(),
    availableSizes: Array.from(sizes),
    availableColors: Array.from(colors),
    tags: product.tags || [],
    metaKeywords: product.metaKeywords || "",
    // Store first image for quick rendering in autocomplete
    thumbnail: product.images && product.images.length > 0 ? product.images[0].url : "",
  };
};

/**
 * Initializes the Meilisearch index with optimal search, filter, and sort settings
 */
export const initializeMeilisearch = async () => {
  try {
    const index = meiliClient.index(INDEX_NAME);
    
    await index.updateSettings({
      searchableAttributes: [
        "name",
        "brand",
        "sku",
        "tags",
        "metaKeywords",
        "description"
      ],
      filterableAttributes: [
        "categoryId",
        "brand",
        "basePrice",
        "availableSizes",
        "availableColors",
        "status"
      ],
      sortableAttributes: [
        "createdAt",
        "salesCount",
        "basePrice"
      ],
      // Typo tolerance is enabled by default, but we can customize it if needed
    });
    
    logger.info("Meilisearch index settings updated successfully.");
  } catch (error) {
    logger.error(error, "Failed to initialize Meilisearch settings");
  }
};

/**
 * Adds or updates a single product in the index
 */
export const indexProduct = async (product: any) => {
  try {
    const doc = transformProductForSearch(product);
    await meiliClient.index(INDEX_NAME).addDocuments([doc]);
  } catch (err) {
    logger.error(err, "Meilisearch index error");
  }
};

/**
 * Removes a product from the index
 */
export const removeProductFromIndex = async (productId: string) => {
  try {
    await meiliClient.index(INDEX_NAME).deleteDocument(productId);
  } catch (err) {
    logger.error(err, "Meilisearch delete error");
  }
};

/**
 * Syncs ALL products from MongoDB to Meilisearch
 */
export const syncAllProductsToMeilisearch = async () => {
  try {
    logger.info("Starting full Meilisearch sync...");
    // Sync all products except archived ones
    const products = await ProductModel.find({ status: { $ne: "archived" } }).lean().exec();
    
    const documents = products.map(transformProductForSearch);
    
    if (documents.length > 0) {
      // Add in batches of 1000 to prevent payload too large errors
      const BATCH_SIZE = 1000;
      for (let i = 0; i < documents.length; i += BATCH_SIZE) {
        const batch = documents.slice(i, i + BATCH_SIZE);
        await meiliClient.index(INDEX_NAME).addDocuments(batch);
      }
    }
    
    logger.info(`Successfully synced ${documents.length} products to Meilisearch.`);
  } catch (error) {
    logger.error(error, "Failed to sync products to Meilisearch");
  }
};
