const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function read(relativePath) {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf8").replace(/\r\n/g, "\n");
}

const sourceFiles = walk(path.join(ROOT, "src")).filter((file) => /\.(?:js|jsx|mjs)$/.test(file));
const badFiles = [];
for (const file of sourceFiles) {
  const text = fs.readFileSync(file, "utf8");
  if (text.includes("\u0000") || /[\u0001-\u0008\u000B\u000C\u000E-\u001F]/.test(text)) badFiles.push(path.relative(ROOT, file));
}
if (badFiles.length) {
  console.error("Render safety failed: control/binary bytes found in source:\n- " + badFiles.join("\n- "));
  process.exit(1);
}

const app = read("src/app-source.jsx");
const rowsDeclaration = app.indexOf("const rows = scheduledTasksForView");
const notificationEffect = app.indexOf('document.addEventListener("plushlife-notification-task-action"');
if (rowsDeclaration < 0 || notificationEffect < 0 || rowsDeclaration > notificationEffect) {
  console.error("Render safety failed: task notification effect must stay after rows initialization.");
  process.exit(1);
}

const shared = read("src/components/shared.jsx");
if (!shared.includes("class PanelErrorBoundary") || !shared.includes("getDerivedStateFromError")) {
  console.error("Render safety failed: shared panel error boundary is missing.");
  process.exit(1);
}

const smart = read("src/components/smart-next-step.jsx");
if (!smart.includes("buildSmartTaskProfile") || !smart.includes("rankSmartTask")) {
  console.error("Render safety failed: One Next Step is bypassing the shared task intelligence layer.");
  process.exit(1);
}

console.log(`Render safety checks passed across ${sourceFiles.length} source files.`);
