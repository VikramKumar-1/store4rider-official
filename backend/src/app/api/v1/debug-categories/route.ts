import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../../core/database/connection";
import { ProductModel } from "../../../../modules/product/product.model";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    // Fetch a sample of products to analyze their magentoCategories
    const products = await ProductModel.find({ magentoCategories: { $exists: true, $ne: "" } })
      .select("name magentoCategories categorySlugs")
      .limit(50)
      .lean();
      
    // Count total products
    const total = await ProductModel.countDocuments();
    const withMagentoCats = await ProductModel.countDocuments({ magentoCategories: { $exists: true, $ne: "" } });
    const withCategorySlugs = await ProductModel.countDocuments({ "categorySlugs.0": { $exists: true } });

    return NextResponse.json({
      stats: { total, withMagentoCats, withCategorySlugs },
      sampleProducts: products.slice(0, 10)
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
