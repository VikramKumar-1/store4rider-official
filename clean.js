const fs = require('fs');
const path = require('path');

const paths = [
  path.join(__dirname, 'backend', '.next'),
  path.join(__dirname, 'frontend', '.next')
];

paths.forEach(p => {
  if (fs.existsSync(p)) {
    fs.rmSync(p, { recursive: true, force: true });
    console.log(`Deleted: ${p}`);
  }
});
