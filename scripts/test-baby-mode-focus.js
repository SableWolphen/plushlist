const fs = require("fs");
const path = require("path");

const source = fs.readFileSync(path.join(__dirname, "..", "src", "components", "baby-today.jsx"), "utf8").replace(/\r\n/g, "\n");

const checks = [
  [!source.includes("YOUR TINY THING") && !source.includes("Make it tinier"), "Baby Mode removes the standalone Tiny Thing card"],
  [!source.includes(">🌼 Soft</button>") && !source.includes(">🌱 Tiny</button>") && !source.includes(">♥ Comfort</button>"), "secondary mode choices are removed from the primary task card"],
  [source.includes("I need a little help"), "comfort help stays one-tap accessible"],
  [source.includes("More when I’m ready"), "advanced choices are progressively disclosed"],
  [source.includes("LITTLE PLAN") && source.includes("Hey baby, here’s what we’re doing today"), "schedule uses caregiver-style language"],
  [source.includes("schedulePreviewCount = 2"), "schedule defaults to only two visible items"],
  [source.includes("keep <strong>{comfortItem}</strong> close") || source.includes("bring it with you if that helps"), "schedule can remind the user about their comfort item"],
  [source.includes("useState(true)") && source.includes("waiting.slice(0, 3)"), "the first three little jobs appear immediately without a separate primary card"],
  [source.includes("SEE TODAY’S LITTLE PLAN") && source.includes("<details aria-label"), "the caregiver plan is collapsed until requested"],
  [source.includes("caregiverScheduleText"), "schedule entries are softened instead of copied as planner text"],
];

const failures = checks.filter(([ok]) => !ok).map(([, label]) => label);
if (failures.length) {
  console.error("Baby Mode focus checks failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log(`Baby Mode focus checks passed (${checks.length}).`);
