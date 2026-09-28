const fs = require('fs');
const path = require('path');

const file1 = path.join(__dirname, 'backend', 'middleware.ts');
const file2 = path.join(__dirname, 'backend', 'src', 'proxy.ts');

if (fs.existsSync(file1)) fs.unlinkSync(file1);
if (fs.existsSync(file2)) fs.unlinkSync(file2);

console.log("Deleted conflicting middleware and proxy files");
