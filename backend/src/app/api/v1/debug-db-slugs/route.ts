import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/core/database/connection";
import { ProductModel } from "@/modules/product/product.model";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const products = await ProductModel.find({}).select("categorySlugs").lean().exec();
    
    const uniqueSlugs = new Set<string>();
    products.forEach(p => {
      if (Array.isArray(p.categorySlugs)) {
        p.categorySlugs.forEach(s => uniqueSlugs.add(s));
      }
    });

    return NextResponse.json({
      success: true,
      slugs: Array.from(uniqueSlugs).sort()
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
