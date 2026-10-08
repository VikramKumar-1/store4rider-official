const fs = require('fs');
const path = require('path');

function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(file));
        } else {
            results.push(file);
        }
    });
    return results;
}

const frontendDir = path.join(__dirname, 'frontend', 'src');
const files = walkDir(frontendDir).filter(f => f.includes('ProductCard') || f.includes('ProductList'));
console.log(files);
