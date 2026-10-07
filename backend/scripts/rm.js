const fs = require('fs');
try {
  fs.unlinkSync('backend/test-cat.ts');
  console.log("Deleted backend/test-cat.ts");
} catch (e) {}
