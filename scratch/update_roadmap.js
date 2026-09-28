const fs = require('fs');
const content = fs.readFileSync('ROADMAP.md', 'utf8');
const updated = content.replace(
  '- [ ] **5-C.3** Create `backend/src/modules/warehouse/`',
  '- [x] **5-C.3** Create `backend/src/modules/warehouse/`'
);
fs.writeFileSync('ROADMAP.md', updated);
console.log('Done');
