const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

walkDir('src', (file) => {
  if (file.endsWith('.ts') || file.endsWith('.tsx')) {
    let content = fs.readFileSync(file, 'utf8');
    const initial = content;
    
    // Convert utf8 buffer to string correctly assuming mojibake was hardcoded
    content = content.replace(/â€¢/g, '•');
    content = content.replace(/â€“/g, '–');
    content = content.replace(/â†’/g, '→');
    content = content.replace(/âœ“/g, '✓');
    content = content.replace(/âœ•/g, '✕');
    content = content.replace(/â€”/g, '—');
    
    if (content !== initial) {
      fs.writeFileSync(file, content, 'utf8');
      console.log('Fixed', file);
    }
  }
});
