#!/usr/bin/env node
// Builds www/ — the Capacitor Android app and Cloudflare static deployment —
// from the same static source files kept at the repository root.

const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");

const ROOT = path.join(__dirname, "..");
const WWW = path.join(ROOT, "www");
const VENDOR = path.join(WWW, "vendor");

const SITE_FILES = [
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
  "social-preview.png",
  "social-preview.svg",
];

const SITE_DIRECTORIES = ["assets"];

const VENDOR_FILES = [
  { src: "node_modules/react/umd/react.production.min.js", dest: "react.production.min.js" },
  { src: "node_modules/react-dom/umd/react-dom.production.min.js", dest: "react-dom.production.min.js" },
  { src: "node_modules/@supabase/supabase-js/dist/umd/supabase.js", dest: "supabase.min.js" },
];

const CDN_REPLACEMENTS = [
  ["https://unpkg.com/react@18/umd/react.production.min.js", "./vendor/react.production.min.js"],
  ["https://unpkg.com/react-dom@18/umd/react-dom.production.min.js", "./vendor/react-dom.production.min.js"],
  ["https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.0/dist/umd/supabase.min.js", "./vendor/supabase.min.js"],
];

const GENERATED_INDEX_SCRIPTS = [
  '<script src="./assets/cloudflare-primary.js"></script>',
  '<script src="./assets/plush-guide.js"></script>',
  '<script src="./assets/plush-tools-fix.js"></script>',
];

function rimraf(target) {
  if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
}

function copyDirectory(source, destination) {
  if (!fs.existsSync(source)) return false;
  fs.cpSync(source, destination, { recursive: true });
  return true;
}

const APP_SOURCE_ENTRY = path.join(ROOT, "src", "app-source.jsx");

function compileAppSource() {
  // esbuild replaces the previous @babel/standalone Babel.transform() call
  // here (module split phase 4 — see docs/module-split-plan.md). This is a
  // real bundle build (not a single-file transform): src/app-source.jsx and
  // anything it imports (e.g. src/components/shared.jsx, phase 5+) get
  // resolved and concatenated into one file. Same JSX shape as before:
  // classic runtime (React.createElement, not the automatic jsx-runtime
  // import), since the app loads React as a global via a <script> tag, not
  // an ES import. Whitespace-only minification (not full identifier
  // renaming) to keep output as close to the previous Babel compact:true
  // shape as possible.
  const result = esbuild.buildSync({
    entryPoints: [APP_SOURCE_ENTRY],
    bundle: true,
    write: false,
    format: "iife",
    loader: { ".jsx": "jsx" },
    jsx: "transform",
    minifyWhitespace: true,
    charset: "utf8",
  });
  const compiled = result.outputFiles[0].text;
  // Runtime Babel previously used Function(compiled), which gave the app its
  // own scope. Keep that boundary in the production bundle so names such as
  // `supabase` never collide with the UMD libraries loaded before the app.
  return `;(function () {\n${compiled}\n}());\n`;
}

function prepareHtml(file, source) {
  let content = source;
  for (const [from, to] of CDN_REPLACEMENTS) content = content.split(from).join(to);

  if (file === "index.html") {
    // index.html already references ./assets/app.bundle.js directly (see
    // src/app-source.jsx and docs/module-split-plan.md — module split phase
    // 4 step 2 unified all three deploy targets, including GitHub Pages,
    // onto this same precompiled bundle; there's no more runtime
    // Babel-in-browser fallback to strip here).
    if (content.includes("babel.min.js") || content.includes('id="app-source"') || content.includes("Babel.transform")) {
      throw new Error("index.html still contains runtime Babel compilation — module split phase 4 step 2 should have removed this");
    }
    for (const script of GENERATED_INDEX_SCRIPTS) {
      if (!content.includes(script)) content = content.replace("</body>", `  ${script}\n</body>`);
    }
  }

  return content;
}

function main() {
  rimraf(WWW);
  fs.mkdirSync(VENDOR, { recursive: true });

  let copiedFiles = 0;
  for (const file of SITE_FILES) {
    const src = path.join(ROOT, file);
    if (!fs.existsSync(src)) continue;
    const destination = path.join(WWW, file);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    if (/\.html$/.test(file)) {
      const content = prepareHtml(file, fs.readFileSync(src, "utf8"));
      fs.writeFileSync(destination, content);
    } else {
      fs.copyFileSync(src, destination);
    }
    copiedFiles += 1;
  }

  let copiedDirectories = 0;
  for (const directory of SITE_DIRECTORIES) {
    if (copyDirectory(path.join(ROOT, directory), path.join(WWW, directory))) copiedDirectories += 1;
  }

  fs.writeFileSync(path.join(WWW, "assets", "app.bundle.js"), compileAppSource());

  let missingVendorFiles = false;
  for (const { src, dest } of VENDOR_FILES) {
    const from = path.join(ROOT, src);
    if (!fs.existsSync(from)) {
      console.error(`Missing vendor source: ${src} — run "npm install" first.`);
      missingVendorFiles = true;
      continue;
    }
    fs.copyFileSync(from, path.join(VENDOR, dest));
  }

  if (missingVendorFiles) process.exitCode = 1;
  console.log(`www/ synced (${copiedFiles} files, ${copiedDirectories} directories, ${VENDOR_FILES.length} vendored scripts, precompiled app bundle).`);
}

main();
