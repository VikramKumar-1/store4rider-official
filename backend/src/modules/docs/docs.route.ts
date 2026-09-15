import { NextRequest, NextResponse } from "next/server";
import { getSwaggerSpec } from "@/core/config/swagger";

/**
 * @file docs.route.ts
 * @description Serves Swagger UI and the OpenAPI JSON spec for automatic testing.
 */
export async function docsRouter(req: NextRequest, routePath: string[]): Promise<NextResponse | null> {
  if (req.method === "GET" && routePath.length === 0) {
    // Serve Swagger UI HTML
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Store4Riders Enterprise API Docs</title>
        <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui.css" />
        <style>
          body { margin: 0; padding: 0; }
        </style>
      </head>
      <body>
        <div id="swagger-ui"></div>
        <script src="https://unpkg.com/swagger-ui-dist@5.9.0/swagger-ui-bundle.js"></script>
        <script>
          window.onload = () => {
            window.ui = SwaggerUIBundle({
              url: '/api/docs/spec',
              dom_id: '#swagger-ui',
            });
          };
        </script>
      </body>
      </html>
    `;
    return new NextResponse(html, { headers: { "Content-Type": "text/html" } });
  }

  if (req.method === "GET" && (routePath[0] === "spec" || routePath.length === 0)) {
    // Serve dynamic OpenAPI JSON Spec generated from JSDoc comments
    return NextResponse.json(getSwaggerSpec());
  }

  return null;
}
