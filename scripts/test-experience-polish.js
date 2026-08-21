#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const polish = fs.readFileSync(path.join(root, "assets", "experience-polish.js"), "utf8");
const today = fs.readFileSync(path.join(root, "src", "components", "today-panel-core.jsx"), "utf8");
const tasks = fs.readFileSync(path.join(root, "src", "components", "tasks-panel.jsx"), "utf8");
const completion = fs.readFileSync(path.join(root, "src", "components", "completed-task-flow.jsx"), "utf8");
const failures = [];
const expect = (value, message) => { if (!value) failures.push(message); };

expect(polish.includes("plushlife:local-product-loop:v1"), "product-loop measurement must remain local-only");
expect(polish.includes("plushlife:task-completion-feedback"), "mascot reactions must use the existing completion event");
expect(polish.includes("plushlife-day-memory"), "calendar must expose a compact day memory");
expect(polish.includes("prefers-reduced-motion:reduce"), "experience polish must respect reduced motion");
expect(polish.includes("forced-colors:active"), "experience polish must support forced colors");
expect(polish.includes('[role="dialog"][aria-modal="true"]'), "mobile dialogs should use the bottom-sheet treatment");
expect(!polish.includes("fetch("), "experience polish must not add a third-party or analytics data flow");
expect(today.includes("WELCOME BACK") && today.includes("No catching up"), "return-after-break flow must remain present");
expect(today.includes("PlushLife noticed:"), "personalization explanations must remain visible");
expect(today.includes("Today is tucked away."), "done-enough state must remain present");
expect(tasks.includes("natural-language schedule parsing") && tasks.includes('aria-label="Schedule in everyday language"'), "natural-language task scheduling must remain available");
expect(completion.includes("navigator.vibrate") && completion.includes("Undo is available"), "completion feedback and undo must remain available");

// Product choice: do not enforce a single dominant action per screen. The
// user explicitly wants the existing multi-action screen structure preserved.
expect(!polish.includes("primary-action") && !polish.includes("secondary-action"), "polish must not demote screens into one-primary-action layouts");

if (failures.length) {
  console.error("Experience polish checks failed:\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log(`Experience polish checks passed (${13} checks).`);
