import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/core/database/connection";
import { ProductModel } from "@/modules/product/product.model";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    // We are doing a targeted fix for touring-pants because the frontend URL is actually plural!
    const renameMap: Record<string, string> = {
      "touring-pant": "touring-pants"
    };

    let totalUpdated = 0;

    // We will find all products and fix their array if needed
    const products = await ProductModel.find({}).select("categorySlugs sku").lean().exec();

    for (const product of products) {
      if (!product.categorySlugs || !Array.isArray(product.categorySlugs)) continue;
      
      let changed = false;
      const newSlugs = product.categorySlugs.map((slug: string) => {
        if (renameMap[slug]) {
          changed = true;
          return renameMap[slug];
        }
        
        // Also automatically fix any missing 's' if the frontend expects it, like riding-boots
        // But for safety, we only rely on the explicit map above to avoid breaking things.
        return slug;
      });

      if (changed) {
        await ProductModel.updateOne(
          { _id: product._id },
          { $set: { categorySlugs: newSlugs } }
        );
        totalUpdated++;
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: "Database categories accurately matched to frontend URLs!", 
      totalUpdated 
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
