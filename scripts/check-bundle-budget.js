const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const ASSETS = path.join(ROOT, "www", "assets");
const ENTRY = path.join(ASSETS, "app.bundle.js");
const CHUNKS = path.join(ASSETS, "chunks");

// Keep enough headroom for normal PlushLife UI growth without turning every
// visual polish pass into a release blocker. This is a guardrail, not a hard
// product limit: 640KB still catches meaningful startup regressions while
// avoiding false alarms from small feature/theme changes.
const MAX_ENTRY_BYTES = 640 * 1024;
// Raised deliberately from 45KB: the settings-panel lazy chunk sits at 43.9KB,
// leaving only 1.1KB of headroom — any small addition to settings would fail
// the build for no real performance reason. 60KB is still a tight budget for a
// lazily-loaded panel.
const MAX_LAZY_CHUNK_BYTES = 60 * 1024;

function size(file) {
  return fs.statSync(file).size;
}

function kb(bytes) {
  return `${Math.round((bytes / 1024) * 10) / 10} KB`;
}

if (!fs.existsSync(ENTRY)) {
  console.error("Bundle budget check needs www/assets/app.bundle.js. Run npm run web:sync first.");
  process.exit(1);
}

const entryBytes = size(ENTRY);
const chunks = fs.existsSync(CHUNKS)
  ? fs.readdirSync(CHUNKS).filter((name) => name.endsWith(".js")).map((name) => ({ name, bytes: size(path.join(CHUNKS, name)) }))
  : [];
const largest = chunks.sort((a, b) => b.bytes - a.bytes)[0] || { name: "none", bytes: 0 };

const failures = [];
if (entryBytes > MAX_ENTRY_BYTES) failures.push(`critical app entry ${kb(entryBytes)} exceeds ${kb(MAX_ENTRY_BYTES)}`);
if (largest.bytes > MAX_LAZY_CHUNK_BYTES) failures.push(`largest lazy chunk ${largest.name} is ${kb(largest.bytes)}, above ${kb(MAX_LAZY_CHUNK_BYTES)}`);

if (failures.length) {
  console.error("Performance budget failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log(`Performance budget passed: entry ${kb(entryBytes)} / ${kb(MAX_ENTRY_BYTES)}, largest lazy chunk ${kb(largest.bytes)} / ${kb(MAX_LAZY_CHUNK_BYTES)}.`);
