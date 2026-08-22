#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const source = fs.readFileSync(path.join(root, "assets", "weekly-reflection-window.js"), "utf8");
const entitlements = fs.readFileSync(path.join(root, "assets", "entitlements.js"), "utf8");
const failures = [];
const expect = (value, message) => { if (!value) failures.push(message); };

expect(source.includes("day === 0") && source.includes("getHours() >= 18"), "weekly reflection should open Sunday evening");
expect(source.includes("day === 1 || day === 2"), "weekly reflection should stay available Monday and Tuesday");
expect(source.includes("plushlife:weekly-reflection-ready:v1"), "weekly reflection should remember each surfaced week locally");
expect(source.includes('window.localStorage.setItem(storageKey(now), "shown")'), "weekly reflection should auto-surface only once per week");
expect(source.includes("See my week") && source.includes("Not now"), "weekly reflection should offer a gentle open-or-dismiss choice");
expect(source.includes("plushgrowth") && source.includes("growth"), "weekly reflection should route into the existing Growth view");
expect(source.includes("No catching up needed"), "weekly reflection should preserve the no-catch-up tone");
expect(source.includes("visits || 0") && source.includes("completions || 0"), "weekly reflection should avoid interrupting brand-new users");
expect(!source.includes("fetch("), "weekly reflection must remain local and add no third-party data flow");
expect(entitlements.includes("./assets/weekly-reflection-window.js"), "weekly reflection runtime must load with the app");

if (failures.length) {
  console.error("Weekly reflection checks failed:\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log(`Weekly reflection checks passed (${10} checks).`);
