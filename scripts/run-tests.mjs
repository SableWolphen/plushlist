#!/usr/bin/env node
// Runs every PlushLife check script and prints one pass/fail summary.
//
// Unlike a long "a && b && c" chain, this keeps going after a failure so a
// single run shows every broken check, not just the first one.
//
// Usage:
//   npm test                      run the full suite
//   npm test -- calendar guardian run only checks whose file name contains
//                                 any of the given words
//   npm test -- --bail            stop at the first failure
//
// Adding a check: create scripts/test-<name>.(js|mjs|cjs|py) and add the file
// name to TESTS below. The runner fails if a test file on disk is missing from
// this list, so a new check cannot be silently skipped.

import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptsDir, "..");

// Order matters: it matches the original chained command.
const TESTS = [
  "test-service-worker-first-visit.mjs",
  "test-calendar-account-guards.mjs",
  "test-gentle-everyday-assistant.mjs",
  "test-gentle-calendar.mjs",
  "test-adaptive-day.mjs",
  "test-short-task-flow.cjs",
  "test-workspace-simplicity.cjs",
  "test-play-release.py",
  "test-care-guardian-workspaces.cjs",
  "test-streamlined-navigation.mjs",
  "test-e2e-regressions.mjs",
  "test-business-launch.cjs",
  "test-subscription-policy.mjs",
  "test-smart-care-schedule.mjs",
  "test-startup-recovery.cjs",
  "test-together-corner.cjs",
  "test-habit-studio.cjs",
  "test-gentle-day-tools.cjs",
  "test-companion-experience.cjs",
  "test-private-save.mjs",
  "test-reward-moment.cjs",
  "test-home-return.cjs",
  "test-gentle-onboarding.cjs",
  "test-cozy-personalization.cjs",
  "test-cozy-comfort.mjs",
  "test-cozy-interactions.cjs",
  "test-mascot-wardrobe.mjs",
  "test-care-history.mjs",
  "test-task-intelligence.mjs",
  "test-personal-day-model.mjs",
  "test-recommendation-learning.mjs",
  "test-habit-learning.mjs",
  "test-mobile-ux.js",
  "test-core-feature-reachability.js",
  "test-figma-worlds.js",
  "test-home-layout.mjs",
  "test-render-safety.js",
  "test-baby-mode-focus.js",
  "test-care-upgrades.js",
  "test-entitlements.js",
  "test-premium-smart.js",
  "test-plush-content.js",
  "test-plush-helpers.js",
  "test-plush-schedule.js",
  "test-phone-time-notifications.js",
  "test-plush-memory.js",
  "test-plush-billing.js",
  "test-plush-runtime.js",
  "test-experience-polish.js",
  "test-weekly-reflection-window.js",
  "test-product-experience.js",
  "test-selection-wiring.js",
  "audit-interactive-wiring.js",
  "test-product-quality.js",
  "test-share-win.mjs",
  "test-backup-recovery.js",
  "test-release-readiness.js",
  "test-store-readiness.js",
  "test-auth-theme-readiness.js",
  "validate-app-source.js",
  "validate-ui-assets.js",
  "validate-static-deployment.js",
  "validate-android-widget.js",
  "test-build-dependencies.cjs",
  "test-appearance-polish.cjs",
  "test-workflow-safety.js",
  "test-quality-fixes.mjs",
  "test-everyday-upgrades.mjs",
  "test-cozy-day-experience.mjs",
  "test-android-shortcuts.mjs",
  "test-storybook-home.mjs",
  "test-plush-guardian.mjs",
  "test-guardian-next.mjs",
  "test-theme-persistence.mjs",
  "test-simplified-home.mjs",
  "test-bot-guardian.mjs",
  "test-guardian-discoverability.mjs",
  "test-unified-guardian.mjs",
  "test-guardian-care.mjs",
  "test-calm-home.mjs",
  "test-background-learning-boundary.mjs",
  "test-companion-account-boundary.mjs",
  "test-guardian-smart-home.mjs",
  "test-guardian-reward-hub.mjs",
  "test-guardian-simple-settings.mjs",
  "test-no-spurious-popups.mjs",
  "test-kid-simple-navigation.mjs",
  "test-simple-view.mjs",
  "test-world-backgrounds.mjs",
  "test-synthetic-cozy-guardian.mjs",
  "test-business-analytics.mjs",
  "test-android-release-contract.mjs",
];

const args = process.argv.slice(2);
const bail = args.includes("--bail");
const filters = args.filter((arg) => !arg.startsWith("--")).map((arg) => arg.toLowerCase());

function pythonCommand() {
  for (const candidate of [process.env.PYTHON, "python", "python3"].filter(Boolean)) {
    const probe = spawnSync(candidate, ["--version"], { stdio: "ignore" });
    if (!probe.error && probe.status === 0) return candidate;
  }
  return "python";
}

function commandFor(file) {
  if (file.endsWith(".py")) return [pythonCommand(), [path.join("scripts", file)]];
  return [process.execPath, [path.join("scripts", file)]];
}

// Guard: every test-*.{js,mjs,cjs,py} file on disk must be listed above.
const onDisk = readdirSync(scriptsDir).filter((name) => /^test-.+\.(m?js|cjs|py)$/.test(name));
const unlisted = onDisk.filter((name) => !TESTS.includes(name));
const missing = TESTS.filter((name) => !onDisk.includes(name) && name.startsWith("test-"));
if (!filters.length && (unlisted.length || missing.length)) {
  if (unlisted.length) console.error("These test files exist but are not in scripts/run-tests.mjs:\n- " + unlisted.join("\n- "));
  if (missing.length) console.error("These listed tests do not exist:\n- " + missing.join("\n- "));
  process.exit(1);
}

const selected = filters.length ? TESTS.filter((name) => filters.some((word) => name.toLowerCase().includes(word))) : TESTS;
if (!selected.length) {
  console.error("No checks matched: " + filters.join(", "));
  process.exit(1);
}

const failures = [];
const started = Date.now();
for (const file of selected) {
  const [command, commandArgs] = commandFor(file);
  const result = spawnSync(command, commandArgs, { cwd: repoRoot, stdio: "inherit" });
  if (result.error || result.status !== 0) {
    failures.push(file);
    console.error(`\n✗ ${file} failed${result.error ? ` (${result.error.message})` : ` (exit ${result.status})`}\n`);
    if (bail) break;
  }
}

const seconds = ((Date.now() - started) / 1000).toFixed(1);
const ran = bail && failures.length ? selected.indexOf(failures[0]) + 1 : selected.length;
console.log(`\n${ran - failures.length}/${ran} checks passed in ${seconds}s.`);
if (failures.length) {
  console.error("Failed checks:\n- " + failures.join("\n- "));
  process.exit(1);
}
