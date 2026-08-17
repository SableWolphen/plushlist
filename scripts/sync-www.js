#!/usr/bin/env node
// Builds www/ — the Capacitor Android app and Cloudflare static deployment —
// from the same static source files kept at the repository root.

const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");

const ROOT = path.join(__dirname, "..");
const WWW = path.join(ROOT, "www");
const VENDOR = path.join(WWW, "vendor");
const APP_SOURCE_ENTRY = path.join(ROOT, "src", "app-source.jsx");

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

const GENERATED_INDEX_PRELOADS = [
  '<link rel="preload" href="./vendor/react.production.min.js" as="script">',
  '<link rel="preload" href="./vendor/react-dom.production.min.js" as="script">',
  '<link rel="preload" href="./vendor/supabase.min.js" as="script">',
  '<link rel="preload" href="./assets/fast-start.js" as="script">',
  '<link rel="preload" href="./assets/plush-content.js" as="script">',
  '<link rel="preload" href="./assets/plush-helpers.js" as="script">',
  '<link rel="preload" href="./assets/plush-schedule.js" as="script">',
  '<link rel="preload" href="./assets/plush-runtime.js" as="script">',
  '<link rel="modulepreload" href="./assets/app.bundle.js">',
];

const GENERATED_INDEX_SCRIPTS = [
  '<script src="./assets/plush-runtime.js"></script>',
  '<script src="./assets/cloudflare-primary.js"></script>',
  '<script src="./assets/plush-guide.js"></script>',
  '<script src="./assets/plush-tools-fix.js"></script>',
];

const BOOT_SHELL_STYLE = `<style id="plush-boot-style">
#plush-boot-shell{min-height:100vh;padding:max(16px,env(safe-area-inset-top)) 16px 24px;font-family:system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#FFF6FB;color:#5B4B6B;box-sizing:border-box}
#plush-boot-shell .boot-head{display:flex;align-items:center;gap:10px;max-width:760px;margin:0 auto 18px;font-weight:900;font-size:20px}
#plush-boot-shell .boot-bear{font-size:27px}
#plush-boot-shell .boot-card{max-width:760px;margin:0 auto;padding:16px;border:1px solid #E7D9EC;border-radius:18px;background:rgba(255,255,255,.82);box-shadow:0 7px 22px rgba(118,85,138,.07)}
#plush-boot-shell .boot-kicker{font-size:10px;letter-spacing:.14em;font-weight:900;color:#A65DC1}
#plush-boot-shell .boot-line{height:13px;margin-top:11px;border-radius:999px;background:linear-gradient(90deg,#EADCF2,#F8EFFB,#EADCF2);animation:plushBootPulse 1.1s ease-in-out infinite}
#plush-boot-shell .boot-line.main{width:56%;height:18px}.boot-line.mid{width:86%}.boot-line.short{width:67%}
#plush-boot-shell .boot-status{margin-top:14px;font-size:11px;font-weight:800;color:#8C6B9E}
@keyframes plushBootPulse{0%,100%{opacity:.5}50%{opacity:1}}
@media(prefers-reduced-motion:reduce){#plush-boot-shell .boot-line{animation:none}}
</style>`;

const BOOT_SHELL_HTML = `<div id="plush-boot-shell" role="status" aria-live="polite">
  <div class="boot-head"><span class="boot-bear" aria-hidden="true">🧸</span><span>PlushLife</span></div>
  <div class="boot-card">
    <div class="boot-kicker">TODAY</div>
    <div class="boot-line main"></div>
    <div class="boot-line mid"></div>
    <div class="boot-line short"></div>
    <div class="boot-status">Opening your day…</div>
  </div>
</div>`;

// These panels are rendered in the root tree even while closed. Keeping their
// tiny wrappers in the startup bundle, while loading their real implementations
// only when open becomes true, prevents rarely-used screens from bloating the
// first authenticated render.
const LAZY_PANEL_MODULES = new Map([
  ["./components/schedule-editor-panel.jsx", ["ScheduleEditorPanel"]],
  ["./components/rewards-panel.jsx", ["RewardsPanel"]],
  ["./components/admin-panel.jsx", ["AdminPanel"]],
  ["./components/settings-panel.jsx", ["SettingsPanel"]],
  ["./components/tasks-panel.jsx", ["TasksPanel"]],
  ["./components/guardian-panel.jsx", ["GuardianPanel"]],
  ["./components/care-panel.jsx", ["CarePanel"]],
  ["./components/progress-panel.jsx", ["ProgressPanel"]],
  ["./components/week-panel.jsx", ["WeekPanel"]],
]);

const IDLE_PREFETCH_PRIORITY = [
  "week-panel.jsx",
  "progress-panel.jsx",
  "settings-panel.jsx",
];

function rimraf(target) {
  if (fs.existsSync(target)) fs.rmSync(target, { recursive: true, force: true });
}

function copyDirectory(source, destination) {
  if (!fs.existsSync(source)) return false;
  fs.cpSync(source, destination, { recursive: true });
  return true;
}

function lazyPanelPlugin() {
  return {
    name: "plushlife-lazy-panels",
    setup(build) {
      build.onResolve({ filter: /^\.\/components\/.*-panel\.jsx$/ }, (args) => {
        if (path.resolve(args.importer || "") !== APP_SOURCE_ENTRY) return null;
        if (!LAZY_PANEL_MODULES.has(args.path)) return null;
        return { path: args.path, namespace: "plushlife-lazy-panel" };
      });

      build.onLoad({ filter: /.*/, namespace: "plushlife-lazy-panel" }, (args) => {
        const exportNames = LAZY_PANEL_MODULES.get(args.path);
        const realModule = args.path.replace("./components/", "");
        const source = exportNames.map((exportName) => `
const Lazy${exportName} = React.lazy(() => import("plush-real:${realModule}").then((module) => ({ default: module.${exportName} })));
function ${exportName}Fallback() {
  return React.createElement(
    "div",
    { className: "plush-lazy-skeleton", role: "status", "aria-live": "polite", "data-panel": "${exportName}" },
    React.createElement("div", { className: "plush-lazy-skeleton__title" }),
    React.createElement("div", { className: "plush-lazy-skeleton__line" }),
    React.createElement("div", { className: "plush-lazy-skeleton__line plush-lazy-skeleton__line--short" }),
    React.createElement("span", { className: "plush-lazy-skeleton__label" }, "Opening ${exportName.replace(/Panel$/, "")}…")
  );
}
export function ${exportName}(props) {
  if (!props || !props.open) return null;
  return React.createElement(
    React.Suspense,
    { fallback: React.createElement(${exportName}Fallback) },
    React.createElement(Lazy${exportName}, props)
  );
}
`).join("\n");
        return { contents: source, loader: "js" };
      });

      build.onResolve({ filter: /^plush-real:/ }, (args) => ({
        path: path.join(ROOT, "src", "components", args.path.slice("plush-real:".length)),
      }));
    },
  };
}

function outputAbsolutePath(outputPath) {
  return path.isAbsolute(outputPath) ? outputPath : path.resolve(ROOT, outputPath);
}

function writeIdlePrefetchManifest(metafile) {
  const outputs = Object.entries(metafile.outputs || {});
  const files = [];

  for (const wanted of IDLE_PREFETCH_PRIORITY) {
    const match = outputs.find(([, meta]) => {
      const entryPoint = String(meta.entryPoint || "").replace(/\\/g, "/");
      return entryPoint.endsWith("/" + wanted) || entryPoint.endsWith(wanted);
    });
    if (!match) continue;
    const relative = path.relative(path.join(WWW, "assets"), outputAbsolutePath(match[0])).replace(/\\/g, "/");
    if (!relative.startsWith("..")) files.push("./assets/" + relative);
  }

  fs.writeFileSync(
    path.join(WWW, "assets", "prefetch-manifest.json"),
    JSON.stringify(files, null, 2) + "\n"
  );
  return files;
}

async function compileAppSource() {
  // The app entry remains the critical Today/startup path. Heavy dashboard and
  // management panels are turned into dynamic imports by the plugin above, so
  // esbuild can emit independent chunks that are fetched only when needed.
  const result = await esbuild.build({
    entryPoints: [APP_SOURCE_ENTRY],
    bundle: true,
    write: true,
    outdir: path.join(WWW, "assets"),
    entryNames: "app.bundle",
    chunkNames: "chunks/[name]-[hash]",
    format: "esm",
    splitting: true,
    plugins: [lazyPanelPlugin()],
    loader: { ".jsx": "jsx" },
    jsx: "transform",
    minifyWhitespace: true,
    minifySyntax: true,
    minifyIdentifiers: false,
    treeShaking: true,
    legalComments: "none",
    charset: "utf8",
    metafile: true,
  });

  const outputs = Object.entries(result.metafile.outputs || {});
  const emittedFiles = outputs.map(([file]) => file);
  const chunkCount = emittedFiles.filter((file) => file.includes("/chunks/") || file.includes("\\chunks\\")).length;
  const prefetchFiles = writeIdlePrefetchManifest(result.metafile);
  const entryMeta = outputs.find(([, meta]) => path.resolve(meta.entryPoint || "") === APP_SOURCE_ENTRY)?.[1];
  const entryBytes = Number(entryMeta?.bytes || 0);
  const lazyChunkBytes = outputs
    .filter(([file]) => file.includes("/chunks/") || file.includes("\\chunks\\"))
    .map(([, meta]) => Number(meta.bytes || 0));
  const largestChunkBytes = lazyChunkBytes.length ? Math.max(...lazyChunkBytes) : 0;
  return { emittedFiles: emittedFiles.length, chunkCount, prefetchCount: prefetchFiles.length, entryBytes, largestChunkBytes };
}

function prepareHtml(file, source) {
  let content = source;
  for (const [from, to] of CDN_REPLACEMENTS) content = content.split(from).join(to);

  if (file === "index.html") {
    if (content.includes("babel.min.js") || content.includes('id="app-source"') || content.includes("Babel.transform")) {
      throw new Error("index.html still contains runtime Babel compilation — module split phase 4 step 2 should have removed this");
    }

    // On Android, let the first auth read use a still-valid persisted local
    // session before the app module starts. Supabase continues its normal
    // verification in the background, but first paint no longer waits on it.
    if (!content.includes('<script src="./assets/fast-start.js"></script>')) {
      content = content.replace(
        '<script src="./assets/app.bundle.js"></script>',
        '<script src="./assets/fast-start.js"></script>\n<script src="./assets/app.bundle.js"></script>'
      );
    }

    // The split app entry is an ES module. Module scripts are deferred by
    // default, while modulepreload lets its critical fetch begin immediately.
    content = content.replace(
      '<script src="./assets/app.bundle.js"></script>',
      '<script type="module" src="./assets/app.bundle.js"></script>'
    );
    if (!content.includes('<script type="module" src="./assets/app.bundle.js"></script>')) {
      throw new Error("index.html is missing the generated ES-module app bundle entry");
    }
    if (!content.includes('<script src="./assets/fast-start.js"></script>')) {
      throw new Error("index.html is missing the fast-start session bridge");
    }

    if (!content.includes('id="plush-boot-style"')) content = content.replace("</head>", `  ${BOOT_SHELL_STYLE}\n</head>`);
    content = content.replace('<div id="root"></div>', `<div id="root">${BOOT_SHELL_HTML}</div>`);

    for (const preload of GENERATED_INDEX_PRELOADS) {
      if (!content.includes(preload)) content = content.replace("</head>", `  ${preload}\n</head>`);
    }

    for (const script of GENERATED_INDEX_SCRIPTS) {
      if (!content.includes(script)) content = content.replace("</body>", `  ${script}\n</body>`);
    }
  }

  return content;
}

function formatKb(bytes) {
  return `${Math.round((Number(bytes || 0) / 1024) * 10) / 10} KB`;
}

async function main() {
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

  const bundleStats = await compileAppSource();

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
  console.log(`www/ synced (${copiedFiles} files, ${copiedDirectories} directories, ${VENDOR_FILES.length} vendored scripts, ${bundleStats.emittedFiles} app outputs, ${bundleStats.chunkCount} lazy chunks, ${bundleStats.prefetchCount} idle-prefetch chunks).`);
  console.log(`Critical app entry: ${formatKb(bundleStats.entryBytes)}; largest lazy chunk: ${formatKb(bundleStats.largestChunkBytes)}.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
