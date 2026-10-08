const { execSync } = require('child_process');
try {
  const result = execSync('node check_price.js', { cwd: 'c:/Users/vikur/Downloads/store4riders/backend', encoding: 'utf-8' });
  console.log(result);
} catch (e) {
  console.error(e.stdout);
  console.error(e.stderr);
}
