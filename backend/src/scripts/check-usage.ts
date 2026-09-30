import fs from "fs";
import path from "path";

function searchInDir(dir: string, keyword: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      searchInDir(fullPath, keyword);
    } else if (fullPath.endsWith(".ts")) {
      const content = fs.readFileSync(fullPath, "utf-8");
      if (content.includes(keyword)) {
        console.log(`Found in: ${fullPath}`);
        const lines = content.split('\n');
        lines.forEach((line, idx) => {
          if (line.includes(keyword)) {
            console.log(`  Line ${idx + 1}: ${line.trim()}`);
          }
        });
      }
    }
  }
}

searchInDir("C:\\Users\\vikur\\Downloads\\store4riders\\backend\\src", "findBySkus");
