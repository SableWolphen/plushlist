#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const source = fs.readFileSync(path.join(__dirname, "..", "assets", "plush-runtime.js"), "utf8");
const failures = [];

function requireText(text, message) {
  if (!source.includes(text)) failures.push(message);
}

requireText('METRICS_KEY = "plushlife_runtime_metrics_v1"', "Runtime metrics must stay in the local diagnostics ring.");
requireText('ERRORS_KEY = "plushlife_runtime_errors_v1"', "Runtime errors must stay in the local diagnostics ring.");
requireText('MAX_METRICS = 40', "Runtime metrics ring must remain bounded.");
requireText('MAX_ERRORS = 20', "Runtime errors ring must remain bounded.");
requireText('replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}/gi, "[email]")', "Runtime diagnostics must redact email addresses.");
requireText('connection.saveData', "Idle prefetch must respect data-saver mode.");
requireText('effectiveType', "Idle prefetch must avoid very slow connections.");
requireText('requestIdleCallback', "Likely panels should prefetch only during idle time.");
requireText('window.Capacitor', "Completion haptics must remain limited to the native app shell.");
requireText('prefers-reduced-motion:reduce', "Lazy loading polish must respect reduced-motion preferences.");
requireText('first-app-render', "Runtime must capture a first usable render timing.");
requireText('lazy-panel-open', "Runtime must capture lazy-panel opening latency.");

if (/sendBeacon\s*\(/.test(source) || /fetch\s*\(\s*["']https?:/i.test(source)) {
  failures.push("Runtime diagnostics must not upload telemetry to a remote endpoint.");
}

if (failures.length) {
  console.error("Plush runtime tests failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log("plush-runtime tests passed");
