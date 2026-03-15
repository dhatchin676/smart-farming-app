// patch_frontend.js
// Run this once from the backend folder: node patch_frontend.js
// It replaces all hardcoded 'http://localhost:5000' with '' (relative URLs)
// so the frontend works whether served locally or deployed.

const fs   = require('fs');
const path = require('path');

const FRONTEND = path.join(__dirname, '..', 'frontend');
const FILES    = ['index.html','weather.html','soil.html','disease.html','market.html','harvest.html'];

let total = 0;

FILES.forEach(file => {
  const fp  = path.join(FRONTEND, file);
  if (!fs.existsSync(fp)) { console.log(`⚠  Skipped (not found): ${file}`); return; }

  let src     = fs.readFileSync(fp, 'utf8');
  const before = (src.match(/http:\/\/localhost:5000/g) || []).length;

  src = src.replaceAll('http://localhost:5000', '');

  fs.writeFileSync(fp, src, 'utf8');
  total += before;
  console.log(`✅ ${file} — replaced ${before} occurrence(s)`);
});

console.log(`\n🎉 Done! Total replacements: ${total}`);
console.log(`\nNow open: http://localhost:5000`);