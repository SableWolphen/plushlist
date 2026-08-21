const fs = require("fs");
const path = require("path");

const source = fs.readFileSync(path.join(__dirname, "..", "src", "components", "baby-today.jsx"), "utf8").replace(/\r\n/g, "\n");

const checks = [
  [source.includes("🗓 Schedule") && source.includes("🧸 Little Jobs"), "Baby Mode keeps the two primary views"],
  [source.includes("I need a little help"), "comfort help stays one-tap accessible"],
  [source.includes("LITTLE PLAN") && source.includes("caregiverScheduleText"), "schedule stays softened for Baby Mode"],
  [source.includes('aria-label="Little jobs"') && source.includes("CompletedTaskArea"), "little jobs and completed tasks remain available"],
  [source.includes("taskWeekDates.map"), "the compact week selector remains available for little jobs"],
  [!source.includes("More when I’m ready"), "the extra Baby Mode dashboard is removed"],
  [!source.includes("BabyModeCareSuite"), "the duplicated cozy care panel is removed from Baby Today"],
  [!source.includes("BabyHabitAnchor"), "the duplicated habit anchor is removed from Baby Today"],
  [!source.includes(">🌼 Soft</button>") && !source.includes(">🌱 Tiny</button>") && !source.includes(">🗓 Plan</button>"), "secondary mode shortcuts are removed"],
  [!source.includes(">📖 Journal</button>") && !source.includes(">📈 Progress</button>") && !source.includes(">⚙️ Tasks</button>"), "dashboard navigation shortcuts are removed"],
];

const darkMode = fs.readFileSync(path.join(__dirname, "..", "assets", "dark-mode.js"), "utf8");
const helpers = fs.readFileSync(path.join(__dirname, "..", "assets", "plush-helpers.js"), "utf8");
checks.push(
  [darkMode.includes('node.closest(".baby-mode")') && darkMode.includes("DARK_CLASSES.forEach"), "generic dark-mode classification exempts Nursery"],
  [helpers.includes("plushlife-nursery-appearance") && helpers.includes('html[data-plushlife-color-mode="dark"] .baby-mode'), "Nursery has dedicated day and night palettes"],
  [helpers.includes('section[aria-label="Weekly intention"]') && helpers.includes('section[aria-label="Little jobs"]'), "Nursery styling preserves and targets the existing content structure"],
);

const failures = checks.filter(([ok]) => !ok).map(([, label]) => label);
if (failures.length) {
  console.error("Baby Mode focus checks failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log(`Baby Mode focus checks passed (${checks.length}).`);
