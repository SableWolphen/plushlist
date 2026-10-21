import assert from "node:assert/strict";import fs from "node:fs";
const html=fs.readFileSync("index.html","utf8"),script=fs.readFileSync("assets/simple-view.js","utf8"),css=fs.readFileSync("assets/simple-view.css","utf8");
assert.match(html,/assets\/simple-view\.css/);assert.match(html,/assets\/simple-view\.js/);
assert.match(script,/plushlife:simple-view:v1/);assert.match(script,/aria-pressed/);
assert.match(script,/MutationObserver/);assert.match(script,/localStorage\.setItem/);
assert.match(css,/pl-simple-view/);assert.match(css,/min-height:52px/);
assert.doesNotMatch(script,/supabase|fetch\(|deleteItem|removeItem/);
console.log("Simple View wiring and data-safety smoke tests passed.");