import { NextRequest, NextResponse } from "next/server";
import { PincodeController } from "./pincode.controller";

export async function pincodeRouter(req: NextRequest, routePath: string[]): Promise<NextResponse | null> {
  const method = req.method;
  const pathLen = routePath.length;

  if (method === "GET" && pathLen === 1) {
    const param = routePath[0];
    if (param === "states") {
      return await PincodeController.getDistinctStates(req);
    }
    return await PincodeController.getPincodeDetails(req, param);
  }

  return null;
}
