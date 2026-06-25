const fs = require('fs');
const path = require('path');

const viewsDir = path.resolve(__dirname, '../src/views/seller');
const files = fs.readdirSync(viewsDir).filter(f => f.endsWith('.tsx'));

const patterns = /\{\s*(data|analytics|report|seller|inventory|orders|earnings|row)\s*\}/g;

files.forEach(file => {
  const content = fs.readFileSync(path.join(viewsDir, file), 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, index) => {
    if (line.match(patterns)) {
      console.log(`${file}:${index + 1}: ${line.trim()}`);
    }
  });
});
