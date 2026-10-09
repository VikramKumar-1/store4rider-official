import { NextRequest, NextResponse } from "next/server";
import { ProductValidator } from "../../../../modules/product/product.validator";

export async function GET(req: NextRequest) {
  try {
    const query = ProductValidator.validateListQuery(req);
    return NextResponse.json({ query });
  } catch (error: any) {
    return NextResponse.json({ error: error.message });
  }
}
