import fs from "fs";
import path from "path";

function findFiles(dir: string, filename: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findFiles(fullPath, filename);
    } else if (file === filename) {
      console.log(`Found: ${fullPath}`);
    }
  }
}

findFiles("C:\\Users\\vikur\\Downloads\\store4riders\\backend\\app", "route.ts");
