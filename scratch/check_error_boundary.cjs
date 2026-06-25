const fs = require('fs');
const path = require('path');

const viewsDir = path.resolve(__dirname, '../src/views/seller');
const files = fs.readdirSync(viewsDir).filter(f => f.endsWith('.tsx'));

files.forEach(file => {
  const content = fs.readFileSync(path.join(viewsDir, file), 'utf8');
  if (!content.includes('<ErrorBoundary>')) {
    console.log(`${file} is MISSING ErrorBoundary`);
  }
});
console.log('ErrorBoundary check complete.');
