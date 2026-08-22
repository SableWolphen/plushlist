#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const growth = read("src/components/growth-next-move.jsx");
const weekly = read("assets/weekly-reflection-window.js");
const resume = read("assets/resume-context.js");
const reward = read("assets/gentle-reward.js");
const states = read("assets/state-polish.js");
const entitlements = read("assets/entitlements.js");
const failures = [];
const expect = (value, message) => { if (!value) failures.push(message); };

expect(growth.includes("Why this suggestion?") && growth.includes("WHAT PLUSHLIFE KNOWS LATELY"), "Growth must explain suggestions and distinguish learned patterns");
expect(growth.includes("What PlushLife changed and why") && growth.includes("growth-adjustment-history"), "Growth must keep a local change explanation history");
expect(weekly.includes("reflectionLines") && weekly.includes("YOUR WEEK IS READY"), "weekly reflection must be personalized instead of static");
expect(weekly.includes("day === 0") && weekly.includes("day === 1") && weekly.includes("day === 2"), "weekly reflection must keep the Sunday evening through Tuesday grace window");
expect(!weekly.includes("fetch("), "weekly reflection must remain local-only");
expect(resume.includes("Continue where you left off?") && resume.includes("resume-context:v1"), "resume context must remain gentle and local");
expect(!resume.includes("fetch("), "resume context must not add network traffic");
expect(reward.includes("plushlife:task-completion-feedback") && reward.includes("plushlife-soft-reward"), "completion atmosphere must respond to the existing completion event");
expect(reward.includes("prefers-reduced-motion:reduce"), "completion atmosphere must respect reduced motion");
expect(states.includes('[role="status"]') && states.includes('[role="alert"]'), "loading and error states must share polish rules");
expect(entitlements.includes("./assets/state-polish.js") && entitlements.includes("./assets/gentle-reward.js") && entitlements.includes("./assets/resume-context.js"), "new experience layers must be loaded by the existing runtime");
expect(!entitlements.includes("enforced: true"), "experience work must not activate billing entitlements");

if (failures.length) {
  console.error("Product experience checks failed:\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log(`Product experience checks passed (${12} checks).`);
