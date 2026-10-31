import assert from "node:assert/strict";
import fs from "node:fs";

// A first web visit has no controlling service worker yet. When the new worker
// claims the page, it must not trigger a reload (that would download the app twice).
const html = fs.readFileSync("index.html", "utf8");
assert.match(html, /const hadController = Boolean\(navigator\.serviceWorker\.controller\);/);
assert.match(html, /if \(refreshing \|\| !hadController\) return;/);
console.log("Service worker first-visit reload guard passed.");
