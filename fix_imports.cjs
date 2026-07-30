const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function (file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.tsx') || file.endsWith('.ts')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk(path.join(__dirname, 'src/app/(app)'));

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content
    .replace(/from\s+['"](?:\.\.\/)+components\/(.*?)['"]/g, "from '@/components/$1'")
    .replace(/from\s+['"](?:\.\.\/)+lib\/(.*?)['"]/g, "from '@/lib/$1'")
    .replace(/from\s+['"](?:\.\.\/)+styles\/(.*?)['"]/g, "from '@/styles/$1'");
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Fixed imports in', file);
  }
});
