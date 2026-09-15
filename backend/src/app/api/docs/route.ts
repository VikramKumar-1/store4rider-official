import { NextResponse } from "next/server";
import { getSwaggerSpec } from "@/core/config/swagger";

export async function GET() {
  return NextResponse.json(getSwaggerSpec());
}
