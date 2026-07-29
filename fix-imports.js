const fs = require('fs');
const path = require('path');

const srcDir = path.resolve(__dirname, 'src');
const apiDir = path.join(srcDir, 'app', 'api');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else if (filePath.endsWith('.ts')) {
      results.push(filePath);
    }
  });
  return results;
}

const files = walk(apiDir);

files.forEach(file => {
  if (file.endsWith('responseHelper.ts')) return;

  const fileDir = path.dirname(file);
  let relToSrc = path.relative(fileDir, srcDir).replace(/\\/g, '/');
  let relToApi = path.relative(fileDir, apiDir).replace(/\\/g, '/');
  
  if (!relToSrc.startsWith('.')) relToSrc = './' + relToSrc;
  if (!relToApi.startsWith('.')) relToApi = './' + relToApi;

  let content = fs.readFileSync(file, 'utf8');

  // Replace imports
  content = content.replace(/from\s+['"](?:\.\.\/)+responseHelper['"]/g, `from '${relToApi}/responseHelper'`);
  content = content.replace(/from\s+['"](?:\.\.\/)+(?:server\/)?utils\/db['"]/g, `from '${relToSrc}/utils/db'`);
  content = content.replace(/from\s+['"](?:\.\.\/)+(?:server\/)?repositories\/([^'"]+)['"]/g, `from '${relToSrc}/repositories/$1'`);
  content = content.replace(/from\s+['"](?:\.\.\/)+(?:server\/)?services\/([^'"]+)['"]/g, `from '${relToSrc}/server/services/$1'`);
  content = content.replace(/from\s+['"](?:\.\.\/)+(?:server\/)?engine\/([^'"]+)['"]/g, `from '${relToSrc}/server/engine/$1'`);
  content = content.replace(/from\s+['"](?:\.\.\/)+(?:server\/)?models\/([^'"]+)['"]/g, `from '${relToSrc}/models/$1'`);
  content = content.replace(/from\s+['"](?:\.\.\/)+(?:server\/)?validators\/([^'"]+)['"]/g, `from '${relToSrc}/validators/$1'`);
  content = content.replace(/from\s+['"](?:\.\.\/)+(?:server\/)?types\/([^'"]+)['"]/g, `from '${relToSrc}/types/$1'`);

  fs.writeFileSync(file, content);
});

console.log('Fixed imports');
