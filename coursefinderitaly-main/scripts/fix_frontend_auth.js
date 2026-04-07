const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

const targetDir = path.resolve(__dirname, '../React/src');

walkDir(targetDir, (filePath) => {
  if (filePath.endsWith('.jsx')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Remove old header token fetching
    content = content.replace(/['"]?x-auth-token['"]?:\s*(?:localStorage|sessionStorage)\.getItem\(['"]token['"]\)(?:\s*\|\|\s*(?:sessionStorage|localStorage)\.getItem\(['"]token['"]\))?,?\s*/gi, '');
    
    // If headers object became empty: `headers: { }` or `headers: {\n }` -> remove it completely or leave it
    content = content.replace(/headers:\s*\{\s*\},?\s*/g, '');

    // Add credentials: 'include' to fetch calls. Be careful not to duplicate.
    content = content.replace(/fetch\(([^,]+),\s*\{/g, (match, p1) => {
      return `fetch(${p1}, {\n      credentials: 'include',`;
    });

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
