import assert from "node:assert/strict";import fs from "node:fs";
const home=fs.readFileSync("src/components/today-panel.jsx","utf8");
const html=fs.readFileSync("index.html","utf8");
const css=fs.readFileSync("assets/home-calm-layout.css","utf8");
// The extra tools sit directly inside "More for today" rather than in a drawer-in-a-drawer.
assert.doesNotMatch(home, /<details className="pl-home-extra-tools">/, "Do not nest a second drawer inside More for today");
assert.match(home, /optionalTools=\{<><div className="pl-home-extra-tools-body">/);
assert.match(home, /<EveningGratitude\/><\/div><\/>\}/);
assert.doesNotMatch(home, /className="pl-quick-paths"/, "Remove oversized duplicated navigation shortcuts");
assert.match(html, /assets\/home-calm-layout\.css/);
assert.match(css, /min-height: 52px/);
console.log("Calm Home navigation and optional tools preserved.");
