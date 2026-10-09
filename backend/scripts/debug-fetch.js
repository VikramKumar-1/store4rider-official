const fs = require('fs');
fetch('http://localhost:4000/api/v1/debug-desc')
  .then(res => res.text())
  .then(data => {
    fs.writeFileSync('C:\\Users\\vikur\\.gemini\\antigravity\\brain\\673c1dfe-da6d-4083-9b3b-e68360f907b1\\scratch\\raw-desc.json', data);
  });
