const fs = require('fs');
fetch('http://localhost:4000/api/v1/debug-desc')
  .then(res => res.json())
  .then(data => {
    fs.writeFileSync('C:\\Users\\vikur\\Downloads\\store4riders\\debug-desc.json', JSON.stringify(data, null, 2));
  });
