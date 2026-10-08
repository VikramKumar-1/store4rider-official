const { execSync } = require('child_process');
const fs = require('fs');

try {
  const result = execSync('node check_price.js', { cwd: 'c:/Users/vikur/Downloads/store4riders/backend', encoding: 'utf-8' });
  fs.writeFileSync('c:/Users/vikur/.gemini/antigravity/brain/25a3c354-15ba-474f-8272-20fad73bcb94/scratch/price_out.txt', result);
} catch (e) {
  fs.writeFileSync('c:/Users/vikur/.gemini/antigravity/brain/25a3c354-15ba-474f-8272-20fad73bcb94/scratch/price_out.txt', e.stdout + "\n" + e.stderr);
}
