const fs = require("fs");

function read(path) { return fs.readFileSync(path, "utf8"); }
function write(path, value) { fs.writeFileSync(path, value); }
function replaceOnce(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`Missing marker: ${label}`);
  return source.replace(needle, replacement);
}

// Add a non-paywalled Gold Preview section to Settings.
{
  const path = "src/components/organized-settings.jsx";
  let source = read(path);
  source = replaceOnce(
    source,
    'import { ToolPanel } from "./shared.jsx";\n',
    'import { ToolPanel } from "./shared.jsx";\nimport { PlushGoldPreview } from "./plush-gold-preview.jsx";\n',
    "settings Gold import",
  );
  source = replaceOnce(
    source,
    '    ["support", "💬", "Help & Feedback", "Send feedback or report something that feels off", "feedback help support bug"],\n    ["account", "🔑", "Account", "Email, sync status, sessions, and account controls", "account email sync sign out delete account"],',
    '    ["support", "💬", "Help & Feedback", "Send feedback or report something that feels off", "feedback help support bug"],\n    ["gold", "✨", "Plush Gold Preview", "Future premium intelligence · everything included free for now", "gold premium plus preview subscription intelligence"],\n    ["account", "🔑", "Account", "Email, sync status, sessions, and account controls", "account email sync sign out delete account"],',
    "settings Gold category",
  );
  source = replaceOnce(
    source,
    '  const account = (\n',
    '  const gold = (\n    <>\n      <DetailHeader title="Plush Gold Preview" onBack={() => setSection("home")} />\n      <PlushGoldPreview />\n    </>\n  );\n\n  const account = (\n',
    "settings Gold page",
  );
  source = replaceOnce(
    source,
    '  const pages = { home, personalize, notifications, experience, devices, rest, privacy, support, account };',
    '  const pages = { home, personalize, notifications, experience, devices, rest, privacy, support, gold, account };',
    "settings Gold route",
  );
  write(path, source);
}

// The deep behavioral learner is Gold-ready. During free_preview this remains
// active for everyone; if access is changed later, the core app still works.
{
  const path = "src/components/habit-background-engine.jsx";
  let source = read(path);
  source = 'import { hasGoldFeature } from "../plush-gold.js";\n\n' + source;
  source = replaceOnce(
    source,
    'export function HabitBackgroundEngine({ open, rows = [], viewDone = {}, period, dailyCheckIn = {} }) {\n  const previousDoneRef',
    'export function HabitBackgroundEngine({ open, rows = [], viewDone = {}, period, dailyCheckIn = {} }) {\n  const goldBackground = hasGoldFeature("adaptive_habit_coaching") || hasGoldFeature("recovery_intelligence");\n  const previousDoneRef',
    "background Gold access",
  );
  source = source.replace('    if (!open || !validDate(today)) return;', '    if (!goldBackground || !open || !validDate(today)) return;');
  source = source.replace('  }, [open, today, rows, viewDone, dailyCheckIn?.energy, dailyCheckIn?.capacity, dailyCheckIn?.mood]);', '  }, [goldBackground, open, today, rows, viewDone, dailyCheckIn?.energy, dailyCheckIn?.capacity, dailyCheckIn?.mood]);');
  write(path, source);
}

// Permanent regression coverage: Gold exists, stays free, and billing stays off.
{
  const path = "scripts/test-product-quality.js";
  let source = read(path);
  source = replaceOnce(
    source,
    'const packageJson = read("package.json");\n',
    'const packageJson = read("package.json");\nconst goldAccess = read("src/plush-gold.js");\nconst goldPreview = read("src/components/plush-gold-preview.jsx");\n',
    "Gold test reads",
  );
  const marker = 'const checks = [\n';
  const checks = 'const checks = [\n  [goldAccess.includes(\'PLUSH_GOLD_ACCESS_MODE = "free_preview"\') && goldAccess.includes("PLUSH_GOLD_BILLING_ENABLED = false"), "Plush Gold stays fully unlocked with billing disabled during preview"],\n  [goldAccess.includes("advanced_growth_insights") && goldAccess.includes("smart_next_step") && goldAccess.includes("adaptive_habit_coaching") && goldAccess.includes("advanced_reminders") && goldAccess.includes("habit_experiments") && goldAccess.includes("recovery_intelligence") && goldAccess.includes("expanded_growth_history") && goldAccess.includes("multiple_focus_habits") && goldAccess.includes("advanced_planning") && goldAccess.includes("advanced_personalization") && goldAccess.includes("priority_history_protection") && goldAccess.includes("gold_reports"), "Plush Gold has one central registry for current and reserved premium capabilities"],\n  [goldPreview.includes("Everything is included free for now") && goldPreview.includes("Billing off · free preview"), "Settings clearly explains the free Plush Gold preview"],\n  [settings.includes("Plush Gold Preview") && settings.includes("<PlushGoldPreview />"), "Plush Gold preview is discoverable from Settings"],\n  [progress.includes(\'hasGoldFeature("advanced_growth_insights")\') && smartNextStep.includes(\'hasGoldFeature("smart_next_step")\') && background.includes(\'hasGoldFeature("adaptive_habit_coaching")\'), "advanced intelligence routes through the Gold entitlement model"],\n';
  source = replaceOnce(source, marker, checks, "Gold checks");
  write(path, source);
}

console.log("Plush Gold free-preview setup applied.");
