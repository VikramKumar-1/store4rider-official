import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../../core/database/connection";
import { ProductModel } from "../../../../modules/product/product.model";
import fs from "fs";
import path from "path";
import csv from "csv-parser";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Path to the CSV file
    const csvPath = path.join(
      process.cwd(),
      "../backup-data/latestcsv/Edited product csv of all brands.csv"
    );

    if (!fs.existsSync(csvPath)) {
      return NextResponse.json({ success: false, error: "CSV file not found at " + csvPath });
    }

    const results: any[] = [];
    
    // Read the CSV file
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", resolve)
        .on("error", reject);
    });

    let mainProductUpdates = 0;
    let variantUpdates = 0;

    // Load all products to memory to quickly find variants
    const allProducts = await ProductModel.find({}).select("sku variants").lean();
    const productSkuMap = new Map();
    const variantSkuToParentMap = new Map();

    for (const p of allProducts) {
      productSkuMap.set(p.sku, p);
      if (p.variants && p.variants.length > 0) {
        for (const v of p.variants) {
          variantSkuToParentMap.set(v.sku, p._id);
        }
      }
    }

    const bulkOps = [];

    // Process each row
    for (const row of results) {
      const rowSku = row.sku?.trim();
      if (!rowSku) continue;

      const qty = parseFloat(row.qty || "0") || 0;
      
      // Handle Magento headers mapping
      const stockStatusStr = row.is_in_stock || row.stockStatus || row.stock_status;
      let stockStatus = 0;
      if (stockStatusStr !== undefined) {
         stockStatus = parseInt(stockStatusStr);
      } else {
         stockStatus = qty > 0 ? 1 : 0;
      }
      
      const allowBackorders = row.allow_backorders === "1" || row.allow_backorders === "true";

      // 1. Is it a Main Product?
      if (productSkuMap.has(rowSku)) {
        bulkOps.push({
          updateOne: {
            filter: { sku: rowSku },
            update: { 
              $set: { 
                qty: qty,
                stockStatus: stockStatus,
                allowBackorders: allowBackorders
              }
            }
          }
        });
        mainProductUpdates++;
      }
      
      // 2. Is it a Variant?
      if (variantSkuToParentMap.has(rowSku)) {
        const parentId = variantSkuToParentMap.get(rowSku);
        bulkOps.push({
          updateOne: {
            filter: { _id: parentId, "variants.sku": rowSku },
            update: {
              $set: { "variants.$.stock": qty }
            }
          }
        });
        variantUpdates++;
      }
    }

    // Execute bulk updates in batches of 500
    const BATCH_SIZE = 500;
    for (let i = 0; i < bulkOps.length; i += BATCH_SIZE) {
      const batch = bulkOps.slice(i, i + BATCH_SIZE);
      if (batch.length > 0) {
        await ProductModel.bulkWrite(batch);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Stock sync completed successfully!",
      stats: {
        totalRowsRead: results.length,
        mainProductsUpdated: mainProductUpdates,
        variantsUpdated: variantUpdates,
        bulkOperationsExecuted: bulkOps.length
      }
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
