import fs from 'fs';

const file = fs.readFileSync('C:\\Users\\vikur\\Downloads\\Edited product csv of all brands.csv', 'utf8');
const headers = file.split('\n')[0].split(',').map(h => h.replace(/\"/g, '').trim());

console.log('Weight header:', headers.find(h => h.toLowerCase().includes('weight')));
console.log('Length header:', headers.find(h => h.toLowerCase().includes('length')));
console.log('Width header:', headers.find(h => h.toLowerCase().includes('width')));
console.log('Height header:', headers.find(h => h.toLowerCase().includes('height')));
console.log('HSN/Tax headers:', headers.filter(h => h.toLowerCase().includes('tax') || h.toLowerCase().includes('hsn')));
