#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const REQUIRED_FILES = [
  "index.html",
  "login.html",
  "oauth.html",
  "legal.html",
  "support.html",
  "account-deletion.html",
  "service-worker.js",
  "manifest.webmanifest",
  "icon.svg",
  "icon-192.png",
  "icon-512.png",
  "icon-maskable-192.png",
  "icon-maskable-512.png",
  "assets/care-upgrades.js",
  "assets/entitlements.js",
  "assets/gentle-discovery-ui.js",
  "assets/plushlife-completion.js",
  "assets/cloudflare-primary.js",
  "assets/plush-guide.js",
  "assets/plush-runtime.js",
  "assets/thunderstorm.mp3",
  "capacitor.config.json",
  "wrangler.jsonc",
];

const failures = [];

for (const relativePath of REQUIRED_FILES) {
  const absolutePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(absolutePath)) failures.push(`Missing required deployment file: ${relativePath}`);
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8");
}

if (fs.existsSync(path.join(ROOT, "service-worker.js"))) {
  const serviceWorker = read("service-worker.js");
  if (!serviceWorker.includes('const CACHE_NAME = "plushlife-v65"')) {
    failures.push("Service worker cache is not set to plushlife-v65.");
  }
  for (const shellFile of [
    "login.html",
    "oauth.html",
    "support.html",
    "account-deletion.html",
    "assets/care-upgrades.js",
    "assets/entitlements.js",
    "assets/plush-content.js",
    "assets/plush-helpers.js",
    "assets/plush-schedule.js",
    "assets/plush-billing.js",
    "assets/plush-runtime.js",
    "assets/prefetch-manifest.json",
    "assets/cloudflare-primary.js",
    "assets/plush-guide.js",
    "assets/thunderstorm.mp3",
    "assets/app.bundle.js",
  ]) {
    if (!serviceWorker.includes(`./${shellFile}`)) failures.push(`Service worker app shell does not include ${shellFile}.`);
  }
}

if (fs.existsSync(path.join(ROOT, "scripts/sync-www.js"))) {
  const syncScript = read("scripts/sync-www.js");
  if (!syncScript.includes('format: "esm"') || !syncScript.includes("splitting: true")) {
    failures.push("Production app build is not configured for ES-module code splitting.");
  }
  if (!syncScript.includes("plushlife-lazy-panels") || !syncScript.includes('chunkNames: "chunks/[name]-[hash]"')) {
    failures.push("Production app build is missing lazy-panel chunking safeguards.");
  }
  if (!syncScript.includes('type=\"module\"') || !syncScript.includes('rel=\"modulepreload\"')) {
    failures.push("Generated index is not configured to load the split app entry as a module.");
  }
  if (!syncScript.includes("writeIdlePrefetchManifest") || !syncScript.includes("IDLE_PREFETCH_PRIORITY")) {
    failures.push("Production app build is missing idle-prefetch manifest generation.");
  }
  if (!syncScript.includes('<script src="./assets/plush-runtime.js"></script>')) {
    failures.push("Generated index is not configured to load PlushLife runtime diagnostics.");
  }
  if (!syncScript.includes("plush-lazy-skeleton")) {
    failures.push("Lazy panel fallback no longer uses the polished loading skeleton.");
  }
}

if (fs.existsSync(path.join(ROOT, "assets/plush-runtime.js"))) {
  const runtime = read("assets/plush-runtime.js");
  if (!runtime.includes("first-app-render") || !runtime.includes("lazy-panel-open")) {
    failures.push("Runtime diagnostics are missing critical performance timings.");
  }
  if (!runtime.includes("connection.saveData") || !runtime.includes("requestIdleCallback")) {
    failures.push("Runtime idle prefetching no longer respects connection/idle safeguards.");
  }
  if (!runtime.includes("window.Capacitor") || !runtime.includes("navigator.vibrate")) {
    failures.push("Native completion haptic safeguard is missing.");
  }
}

if (fs.existsSync(path.join(ROOT, "manifest.webmanifest"))) {
  try {
    const manifest = JSON.parse(read("manifest.webmanifest"));
    if (manifest.name !== "PlushLife — Gentle Care Companion") failures.push("Manifest app name changed unexpectedly.");
    if (manifest.display !== "standalone") failures.push("Manifest must remain installable in standalone mode.");
    if (!Array.isArray(manifest.icons) || manifest.icons.length < 4) failures.push("Manifest is missing required app icons.");
  } catch (error) {
    failures.push(`Manifest is invalid JSON: ${error.message}`);
  }
}

if (fs.existsSync(path.join(ROOT, "wrangler.jsonc"))) {
  const wrangler = read("wrangler.jsonc");
  if (!wrangler.includes('"directory": "./www"')) failures.push("Cloudflare must deploy only the generated www directory.");
}

if (fs.existsSync(path.join(ROOT, "capacitor.config.json"))) {
  try {
    const capacitor = JSON.parse(read("capacitor.config.json"));
    if (capacitor.appId !== "com.PlushLife") failures.push("Android package name changed unexpectedly.");
    if (capacitor.server?.url !== "https://plushlife.plushlife-app.workers.dev/") {
      failures.push("Android server URL is not set to the production Cloudflare host.");
    }
  } catch (error) {
    failures.push(`Capacitor config is invalid JSON: ${error.message}`);
  }
}

if (fs.existsSync(path.join(ROOT, "login.html"))) {
  const login = read("login.html");
  if (!login.includes("pvitdhixycegmcovapyh.supabase.co")) failures.push("Login page no longer references the production Supabase project.");
  if (!login.includes("signInWithOtp") || !login.includes("signInWithPassword")) failures.push("Login page is missing an expected authentication method.");
}

if (fs.existsSync(path.join(ROOT, "assets/plush-guide.js"))) {
  const guide = read("assets/plush-guide.js");
  const hasPointOnlyAssurance = guide.includes("walkthrough only points things out");
  const hasDataPreservationAssurance =
    guide.includes("Guided tours never complete tasks") ||
    guide.includes("does not create new data or change existing data");
  if (!hasPointOnlyAssurance || !hasDataPreservationAssurance) {
    failures.push("PlushGuide no longer includes its data-preservation assurance.");
  }
  if (!guide.includes("PlushRescue") || !guide.includes("PlushProgress") || !guide.includes("PlushGuardian")) {
    failures.push("PlushGuide is missing core existing-feature routes.");
  }
}

if (failures.length) {
  console.error("Static deployment validation failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log(`Static deployment validation passed (${REQUIRED_FILES.length} required files checked).`);
