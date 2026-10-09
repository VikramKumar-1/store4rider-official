import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(req: NextRequest) {
  const root = path.resolve(process.cwd(), "../frontend/src");
  let foundFile = "";
  
  function search(dir: string) {
    if (foundFile) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      if (fs.statSync(fullPath).isDirectory()) {
        search(fullPath);
      } else if (file === "ProductCard.tsx" || file === "product-card.tsx") {
        foundFile = fullPath;
        return;
      }
    }
  }
  
  search(root);

  if (foundFile) {
    return NextResponse.json({ path: foundFile, content: fs.readFileSync(foundFile, 'utf8') });
  }

  return NextResponse.json({ error: "ProductCard not found in " + root });
}
