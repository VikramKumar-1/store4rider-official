export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/core/database/connection";
import { ProductModel } from "@/modules/product/product.model";

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    
    const products = await ProductModel.find({ 
      description: { $regex: /customer complaints/i }
    }).select("name").lean().exec();

    return NextResponse.json({ 
        success: true, 
        count: products.length
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
