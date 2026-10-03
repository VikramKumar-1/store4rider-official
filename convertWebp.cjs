const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const dir = path.join(__dirname, 'frontend/public/brands');
const files = fs.readdirSync(dir);

files.forEach(file => {
    if (file.endsWith('.png')) {
        const input = path.join(dir, file);
        const output = path.join(dir, file.replace('.png', '.webp'));
        
        try {
            console.log(`Converting ${file} to webp...`);
            // Use sharp-cli via npx
            execSync(`npx sharp-cli@latest -i "${input}" -o "${output}"`, { stdio: 'inherit' });
            
            // Delete original PNG
            fs.unlinkSync(input);
            console.log(`Successfully converted and replaced ${file}`);
        } catch (e) {
            console.error(`Error converting ${file}:`, e.message);
        }
    }
});
