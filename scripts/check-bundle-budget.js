const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const ASSETS = path.join(ROOT, "www", "assets");
const ENTRY = path.join(ASSETS, "app.bundle.js");
const CHUNKS = path.join(ASSETS, "chunks");

// These are intentionally above the current production sizes (~427 KB entry,
// ~32 KB largest lazy chunk) so ordinary small changes have room while a real
// startup regression fails the build instead of silently accumulating.
const MAX_ENTRY_BYTES = 475 * 1024;
const MAX_LAZY_CHUNK_BYTES = 45 * 1024;

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
