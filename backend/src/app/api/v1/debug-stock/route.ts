import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../../core/database/connection";
import { ProductModel } from "../../../../modules/product/product.model";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Fetch products with stockStatus 0 but having variants with stock > 0
    const products = await ProductModel.find({
      stockStatus: 0,
      "variants.stock": { $gt: 0 }
    })
    .select("name sku qty stockStatus allowBackorders variants categorySlugs magentoCategories")
    .lean();

    const debugData = products.map((p: any) => ({
      name: p.name,
      sku: p.sku,
      qty: p.qty,
      stockStatus: p.stockStatus,
      allowBackorders: p.allowBackorders,
      categories: p.magentoCategories,
      slugs: p.categorySlugs,
      variantsStock: p.variants?.map((v: any) => ({
        sku: v.sku,
        stock: v.stock
      }))
    }));

    return NextResponse.json({
      success: true,
      totalFound: debugData.length,
      products: debugData
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
