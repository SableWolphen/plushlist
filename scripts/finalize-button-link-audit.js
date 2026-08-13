const fs = require('fs');

function replaceOnce(path, from, to, label) {
  const source = fs.readFileSync(path, 'utf8');
  if (!source.includes(from)) throw new Error(`Missing ${label} in ${path}`);
  fs.writeFileSync(path, source.replace(from, to));
}

replaceOnce(
  'scripts/validate-app-source.js',
  "  '✏️ Change my little jobs',",
  "  '✏️ Edit jobs',",
  'current Baby Mode edit-jobs marker',
);
replaceOnce(
  'scripts/validate-app-source.js',
  "  'const visible = showAllLittleJobs ? waiting : waiting.slice(0, 4);',",
  "  'const visible = showAllLittleJobs ? waiting : waiting.slice(0, 3);',",
  'current Baby Mode visible-job marker',
);

const packagePath = 'package.json';
let pkg = fs.readFileSync(packagePath, 'utf8');
if (!pkg.includes('node scripts/audit-interactive-wiring.js')) {
  const marker = 'node scripts/test-product-quality.js';
  if (!pkg.includes(marker)) throw new Error('Missing package test marker');
  pkg = pkg.replace(marker, 'node scripts/audit-interactive-wiring.js && ' + marker);
  fs.writeFileSync(packagePath, pkg);
}
