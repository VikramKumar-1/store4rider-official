import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/reviews/store
 * Proxies to backend to fetch saved Google reviews from MongoDB.
 * Strict zero-mock compliance: Returns actual saved reviews or empty state.
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const queryString = searchParams.toString() ? `?${searchParams.toString()}` : "";

    const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:4000/api";
    const baseUrl = rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
    const fetchUrl = baseUrl.includes("/v1")
      ? `${baseUrl}/reviews/store${queryString}`
      : `${baseUrl}/v1/reviews/store${queryString}`;

    const response = await fetch(fetchUrl, {
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });

    if (response.ok) {
      const data = await response.json();
      return NextResponse.json({
        success: true,
        data: data?.data || [],
      });
    }

    return NextResponse.json({
      success: true,
      data: [],
      message: "No reviews synced yet. Sync reviews via Admin Settings.",
    });
  } catch (error: any) {
    console.error("Error fetching store reviews from backend:", error?.message || error);
    return NextResponse.json({
      success: true,
      data: [],
    });
  }
}

/**
 * POST /api/reviews/store
 * Triggered by Admin "Fetch Latest Reviews" button to fetch latest 10 reviews
 * from SerpApi and persist them into the MongoDB database.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawBaseUrl = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || "http://localhost:4000/api";
    const baseUrl = rawBaseUrl.endsWith("/") ? rawBaseUrl.slice(0, -1) : rawBaseUrl;
    const syncUrl = baseUrl.includes("/v1") ? `${baseUrl}/reviews/store/sync` : `${baseUrl}/v1/reviews/store/sync`;

    const authHeader = req.headers.get("authorization");
    const cookieHeader = req.headers.get("cookie");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    if (authHeader) headers["authorization"] = authHeader;
    if (cookieHeader) headers["cookie"] = cookieHeader;

    const response = await fetch(syncUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        ...(body.apiKey ? { apiKey: body.apiKey } : {}),
        pages: body.pages,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        {
          success: false,
          error: data?.message || data?.error || "Failed to sync reviews with SerpApi",
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("Error in review sync proxy:", error?.message || error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Internal server error syncing reviews",
      },
      { status: 500 }
    );
  }
}
