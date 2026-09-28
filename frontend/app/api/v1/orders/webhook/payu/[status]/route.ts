import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ status: string }> }
) {
  const { status } = await params;
  const isSuccess = status === "success";

  try {
    const rawBody = await req.text();
    const parsedParams = new URLSearchParams(rawBody);
    const txnid = parsedParams.get("txnid") || "";

    // Forward the webhook to the backend API server (port 4000) so the DB order status updates
    const backendApiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1";
    const cleanBackend = backendApiUrl.replace(/\/api\/v1\/?$/, "");

    try {
      await fetch(`${cleanBackend}/api/v1/orders/webhook/payu/${status}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: rawBody,
      });
    } catch (e) {
      // Backend might already have received it or is processing
    }

    const origin = req.nextUrl.origin || "http://localhost:3000";
    const orderParam = txnid ? `&orderId=${encodeURIComponent(txnid)}` : "";

    if (isSuccess) {
      return NextResponse.redirect(`${origin}/checkout?success=true${orderParam}`, 303);
    } else {
      return NextResponse.redirect(`${origin}/checkout?failed=true`, 303);
    }
  } catch (err) {
    const origin = req.nextUrl.origin || "http://localhost:3000";
    return NextResponse.redirect(`${origin}/checkout?failed=true`, 303);
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ status: string }> }
) {
  const { status } = await params;
  const origin = req.nextUrl.origin || "http://localhost:3000";
  if (status === "success") {
    return NextResponse.redirect(`${origin}/checkout?success=true`, 303);
  } else {
    return NextResponse.redirect(`${origin}/checkout?failed=true`, 303);
  }
}
