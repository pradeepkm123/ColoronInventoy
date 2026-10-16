const fs = require('fs');
const path = require('path');

const OLD_URLS = [
  /https:\/\/stockhandle-taxr\.onrender\.com/g,
  /https:\/\/stockhandle\.onrender\.com/g,
  /https:\/\/inventoryapi\.cctvshoppee\.com/g,
  /http:\/\/52\.66\.98\.128:5002/g,
  /http:\/\/localhost:5000/g
];
const NEW_URL = 'http://localhost:5002';

const srcDir = path.join(__dirname, 'my-app', 'src');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else {
      results.push(filePath);
    }
  });
  return results;
}

console.log('Scanning files in:', srcDir);
const files = walk(srcDir);
let updatedCount = 0;

files.forEach(file => {
  // Only process text files
  const ext = path.extname(file).toLowerCase();
  if (!['.js', '.jsx', '.ts', '.tsx', '.css', '.html', '.json'].includes(ext)) {
    return;
  }

  let content = fs.readFileSync(file, 'utf8');
  let original = content;

  OLD_URLS.forEach(regex => {
    content = content.replace(regex, NEW_URL);
  });

  if (content !== original) {
    fs.writeFileSync(file, content, 'utf8');
    console.log(`Updated: ${path.relative(__dirname, file)}`);
    updatedCount++;
  }
});

console.log(`\nDone! Successfully updated ${updatedCount} files.`);
