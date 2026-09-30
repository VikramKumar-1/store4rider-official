import fs from "fs";

const nextDir = "C:\\Users\\vikur\\Downloads\\store4riders\\backend\\.next";
if (fs.existsSync(nextDir)) {
  fs.rmSync(nextDir, { recursive: true, force: true });
  console.log("Deleted backend/.next folder successfully!");
} else {
  console.log("backend/.next folder not found, skipping.");
}
