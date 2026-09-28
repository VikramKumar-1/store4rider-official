const fs = require('fs');
let content = fs.readFileSync('ROADMAP.md', 'utf8');
content = content.replace('- [ ] **5-C.4**', '- [x] **5-C.4**');
fs.writeFileSync('ROADMAP.md', content);
