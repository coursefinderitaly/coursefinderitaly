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

    // Remove `const token = ...`
    content = content.replace(/const\s+token\s*=\s*(?:localStorage\.getItem\(['"]token['"]\)\s*\|\|\s*sessionStorage\.getItem\(['"]token['"]\)|sessionStorage\.getItem\(['"]token['"]\)\s*\|\|\s*localStorage\.getItem\(['"]token['"]\));\s*/g, '');

    // Remove `'x-auth-token': token`
    content = content.replace(/['"]?x-auth-token['"]?:\s*token,?\s*/g, '');
    
    // Cleanup empty headers: {} again
    content = content.replace(/headers:\s*\{\s*\},?\s*/g, '');

    if (content.match(/localStorage\.removeItem\(['"]token['"]\);\s*sessionStorage\.removeItem\(['"]token['"]\);\s*/)) {
        content = content.replace(/localStorage\.removeItem\(['"]token['"]\);\s*sessionStorage\.removeItem\(['"]token['"]\);\s*/g, 'await fetch(`${API_BASE_URL}/auth/logout`, { method: "POST", credentials: "include" }).catch(()=>{});\n    ');
        
        // ensure handleLogout is async
        content = content.replace(/const handleLogout = \(\) => {/g, 'const handleLogout = async () => {');
    }

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated vars in ${filePath}`);
    }
  }
});
