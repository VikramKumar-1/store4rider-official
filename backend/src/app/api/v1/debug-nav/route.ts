import fs from 'fs';
import path from 'path';

export async function GET() {
  const file = path.join(process.cwd(), '../frontend/src/components/layout/Header.tsx');
  let content = "Not found";
  if (fs.existsSync(file)) {
    content = fs.readFileSync(file, 'utf8');
  } else {
    // try to find navigation.ts
    const navFile = path.join(process.cwd(), '../frontend/src/core/data/navigation.ts');
    if (fs.existsSync(navFile)) {
      content = fs.readFileSync(navFile, 'utf8');
    }
  }
  
  // Extract all hrefs
  const hrefs = content.match(/href="\/[^"]+"/g) || [];
  return new Response(JSON.stringify({ hrefs: Array.from(new Set(hrefs)) }));
}
