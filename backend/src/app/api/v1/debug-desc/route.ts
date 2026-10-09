import { NextRequest, NextResponse } from "next/server";
import fs from 'fs';
import path from 'path';

export async function GET() {
  const file = path.join(process.cwd(), 'src/modules/product/product.service.ts');
  const code = fs.readFileSync(file, 'utf8');
  return NextResponse.json({
    serviceHasCodazon: code.includes('codazon'),
    hasPrep: code.includes('Prep')
  });
}
