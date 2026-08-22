#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const polish = fs.readFileSync(path.join(root, "assets", "experience-polish.js"), "utf8");
const completionRuntime = fs.readFileSync(path.join(root, "assets", "plushlife-completion.js"), "utf8");
const tasks = fs.readFileSync(path.join(root, "src", "components", "tasks-panel.jsx"), "utf8");
const completion = fs.readFileSync(path.join(root, "src", "components", "completed-task-flow.jsx"), "utf8");
const failures = [];
const expect = (value, message) => { if (!value) failures.push(message); };

expect(polish.includes("plushlife:local-product-loop:v1"), "product-loop measurement must remain local-only");
expect(polish.includes("plushlife:task-completion-feedback"), "mascot reactions must use the existing completion event");
expect(polish.includes("plushlife-day-memory"), "calendar must expose a compact day memory");
expect(polish.includes("prefers-reduced-motion:reduce"), "experience polish must respect reduced motion");
expect(polish.includes("forced-colors:active"), "experience polish must support forced colors");
expect(polish.includes('[role=\"dialog\"][aria-modal=\"true\"]'), "dialogs must have a dedicated responsive treatment");
expect(polish.includes("place-items:center !important") && polish.includes("data-plushlife-dialog-panel"), "dialogs must stay centered instead of becoming bottom sheets");
expect(!polish.includes("place-items:end center !important"), "dialogs must not regress to bottom-sheet alignment");
expect(polish.includes("max-height:min(80dvh,700px)") && polish.includes("overscroll-behavior:contain"), "mobile dialogs must fit the viewport and scroll internally");
expect(polish.includes("box-sizing:border-box !important") && polish.includes("calc(100vw - (var(--plush-mobile-gutter) * 2))"), "mobile dialog width must include padding and stay inside the viewport");
expect(polish.includes("overflow-x:hidden !important") && polish.includes("min-width:0 !important"), "dialog panels must prevent horizontal overflow and fixed-width child clipping");
expect(polish.includes("plushlife-modal-open") && polish.includes("visibility:hidden !important"), "QA control must get out of the way while a dialog is open");
expect(polish.includes("overflow-x:auto !important") && polish.includes("scroll-snap-type:x proximity"), "mobile tab rows must remain usable without cramped wrapping");
expect(polish.includes("input,select,textarea { font-size:16px !important; }"), "mobile form fields must avoid browser zoom and tiny text");
expect(!polish.includes("fetch("), "experience polish must not add a third-party or analytics data flow");
expect(completionRuntime.includes("place-items:center") && !completionRuntime.includes("place-items:end center"), "PlushQA must use the same centered-modal pattern");
expect(completionRuntime.includes('data-plushlife-qa-entry=\"true\"') || completionRuntime.includes("dataset.plushlifeQaEntry"), "admin QA entry must remain identifiable for quiet-mode styling");
expect(tasks.includes("natural-language schedule parsing") && tasks.includes('aria-label=\"Schedule in everyday language\"'), "natural-language task scheduling must remain available");
expect(completion.includes("navigator.vibrate") && completion.includes("Undo is available"), "completion feedback and undo must remain available");

// Product choice: preserve the existing multi-action screen structure. These
// checks intentionally avoid pinning user-facing wording so copy can evolve
// without breaking deployment.
expect(!polish.includes("primary-action") && !polish.includes("secondary-action"), "polish must not demote screens into one-primary-action layouts");

if (failures.length) {
  console.error("Experience polish checks failed:\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log(`Experience polish checks passed (${20} checks).`);
