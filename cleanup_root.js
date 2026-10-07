const fs = require('fs');
const path = require('path');

const garbageFiles = [
  "api.js",
  "console.log('Cleared!')",
  "console.log(JSON.parse(data).data.colors.length)",
  "console.log(JSON.parse(data).data.variants[0])",
  "console.log(r.status",
  "convertWebp.cjs",
  "delete_files.js",
  "dl.js",
  "download.js",
  "downloadLogos.cjs",
  "fetchLogos.js",
  "find-yellow-api.js",
  "find-yellow.js",
  "fixLogos.cjs",
  "Lincludes('EXTRACT",
  "Lincludes('const",
  "Lincludes('export",
  "Lincludes('main",
  "Lincludes('return",
  "s.trim().filter(Boolean)"
];

let deletedCount = 0;

garbageFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log("Deleted:", file);
      deletedCount++;
    }
  } catch (err) {
    console.error("Failed to delete:", file, err.message);
  }
});

console.log(`\nCleanup complete! Deleted ${deletedCount} garbage files.`);
