const fs = require('fs');
const path = require('path');

function searchInDir(dir, keyword) {
    let results = [];
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            results = results.concat(searchInDir(fullPath, keyword));
        } else if (stat.isFile() && (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts'))) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            if (content.includes(keyword)) {
                results.push(fullPath);
            }
        }
    }
    return results;
}

const dir = path.join(__dirname, 'frontend', 'src');
console.log(searchInDir(dir, '800+'));
