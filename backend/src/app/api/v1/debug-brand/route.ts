import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "../../../../core/database/connection";
import { ProductModel } from "../../../../modules/product/product.model";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const flexibleBrand = "raida gears";
    const regex = new RegExp(flexibleBrand, "i");
    const wordRegex = new RegExp(`\\b${flexibleBrand}\\b`, "i");

    const query = {
      $or: [
        { brand: { $regex: regex } },
        { "attributes.brand": { $regex: regex } },
        { name: { $regex: wordRegex } }
      ]
    };

    const count = await ProductModel.countDocuments(query);
    const foundProducts = await ProductModel.find(query).select("name brand stockStatus attributes variants.stock allowBackorders").limit(5).lean();

    return NextResponse.json({ count, foundProducts });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
