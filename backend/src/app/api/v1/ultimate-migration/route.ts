import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import Papa from "papaparse";
import { connectToDatabase } from "../../../../core/database/connection";
import { ProductModel } from "../../../../modules/product/product.model";
import { slugify } from "@store4riders/shared-utils";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const dryRun = url.searchParams.get("dryRun") !== "false";
  
  try {
    await connectToDatabase();

    const csvPath = path.resolve(process.cwd(), "../backup-data/latestcsv/Edited product csv of all brands.csv");
    if (!fs.existsSync(csvPath)) {
      return NextResponse.json({ success: false, error: "CSV not found at " + csvPath });
    }

    const fileContent = fs.readFileSync(csvPath, "utf-8");
    
    // Phase 1: Real CSV Parser (handles multiline HTML & quotes)
    const parsed = Papa.parse(fileContent, {
      header: true,
      skipEmptyLines: true,
      quoteChar: '"',
      escapeChar: '"',
    });

    if (parsed.errors.length > 0) {
      console.warn("CSV Parsing Warnings:", parsed.errors.slice(0, 5));
    }

    const rows = parsed.data as any[];
    
    // Dictionaries to map variants
    const simpleSkus = new Map<string, any>();
    const configurableSkus = new Map<string, any>();
    
    for (const row of rows) {
      if (row.product_type === "simple") {
        simpleSkus.set(row.sku, row);
      } else if (row.product_type === "configurable") {
        configurableSkus.set(row.sku, row);
      } else if (row.sku) {
        // standalone or other type
        simpleSkus.set(row.sku, row);
      }
    }

    const bulkOps = [];
    const stats = { processed: 0, parents: 0, variantsMapped: 0, missingVariants: 0 };
    
    // Parse Additional Attributes accurately (State-machine parser)
    const parseAttributes = (attrString: string) => {
      const result: Record<string, any> = {};
      if (!attrString) return result;
      
      let i = 0;
      while (i < attrString.length) {
        const eqIdx = attrString.indexOf('=', i);
        if (eqIdx === -1) break;
        
        const key = attrString.substring(i, eqIdx).trim();
        i = eqIdx + 1;
        let value = "";
        
        if (attrString[i] === '"') {
          i++; // skip open quote
          let endIdx = i;
          while (endIdx < attrString.length) {
            if (attrString[endIdx] === '"') {
               if (attrString[endIdx + 1] === '"') {
                  endIdx += 2; // skip escaped quote
                  continue;
               } else {
                  break; // closing quote
               }
            }
            endIdx++;
          }
          value = attrString.substring(i, endIdx).replace(/""/g, '"');
          i = endIdx + 1;
          if (attrString[i] === ',') i++; // skip comma
        } else {
          const commaIdx = attrString.indexOf(',', i);
          if (commaIdx === -1) {
            value = attrString.substring(i);
            i = attrString.length;
          } else {
            value = attrString.substring(i, commaIdx);
            i = commaIdx + 1;
          }
        }
        
        if (value.includes("|")) {
           result[key] = value.split("|").map(v => v.trim());
        } else {
           result[key] = value.trim();
        }
      }
      return result;
    };

    const cleanCategorySlugs = (magentoCategories: string) => {
      if (!magentoCategories) return [];
      const paths = magentoCategories.split(",");
      const slugs = new Set<string>();
      paths.forEach(p => {
        const parts = p.split("/").map(part => part.trim());
        parts.forEach(part => {
          const lower = part.toLowerCase();
          if (lower.includes("root") || lower.includes("between") || lower.includes("price") || lower.includes("rs.") || lower.includes("₹")) {
             return; // Skip pollution
          }
          if (part) {
             slugs.add(slugify(part));
          }
        });
      });
      return Array.from(slugs);
    };

    for (const [sku, row] of configurableSkus.entries()) {
      stats.parents++;
      const attrs = parseAttributes(row.additional_attributes);
      const catSlugs = cleanCategorySlugs(row.categories);
      
      const updateDoc: any = {
         categorySlugs: catSlugs,
         attributes: attrs,
         brand: attrs.brand || row.brand || undefined,
         gender: attrs.gender ? (Array.isArray(attrs.gender) ? attrs.gender[0] : attrs.gender) : undefined
      };

      // Map Variant Children precisely!
      if (row.configurable_variations) {
         const variantDefs = row.configurable_variations.split("|");
         const variantsArray = [];
         
         for (const def of variantDefs) {
           const parts = def.split(",");
           let childSku = "";
           const options: Record<string, string> = {};
           
           for (const part of parts) {
             const [k, v] = part.split("=");
             if (k.trim().toLowerCase() === "sku") {
               childSku = v.trim();
             } else {
               options[k.trim().toLowerCase()] = v.trim();
             }
           }
           
           if (childSku) {
             const childRow = simpleSkus.get(childSku);
             if (childRow) {
               // VARIANT RULE: Independent stock, price, and attributes!
               const qty = parseFloat(childRow.qty) || 0;
               const stockStatus = parseInt(childRow.is_in_stock) || 0;
               
               const basePrice = parseFloat(childRow.price) || 0;
               const specialPrice = parseFloat(childRow.special_price) || 0;
               
               variantsArray.push({
                 id: childSku,
                 sku: childSku,
                 price: basePrice,
                 specialPrice: specialPrice > 0 ? specialPrice : undefined,
                 stock: stockStatus === 1 ? qty : 0,
                 weight: parseFloat(childRow.weight) || undefined,
                 attributes: options, // Stores exact dynamic axes
               });
               stats.variantsMapped++;
             } else {
               stats.missingVariants++;
             }
           }
         }
         
         if (variantsArray.length > 0) {
            updateDoc.variants = variantsArray;
            
            // Parent minimum price calculation respecting new RULE (only enabled + in-stock)
            const validPrices = variantsArray
               .filter(v => v.stock > 0 && v.price > 0)
               .map(v => v.specialPrice && v.specialPrice < v.price ? v.specialPrice : v.price);
               
            if (validPrices.length > 0) {
               updateDoc.basePrice = Math.min(...validPrices);
            }
         }
      }

      bulkOps.push({
        updateOne: {
          filter: { sku: row.sku },
          update: { $set: updateDoc },
          upsert: false // we only update existing records here
        }
      });
      stats.processed++;
    }

    if (!dryRun && bulkOps.length > 0) {
      await ProductModel.bulkWrite(bulkOps);
    }

    return NextResponse.json({
      success: true,
      mode: dryRun ? "DRY_RUN" : "EXECUTE",
      stats,
      sampleUpdate: bulkOps.slice(0, 3)
    });
    
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message, stack: error.stack });
  }
}
