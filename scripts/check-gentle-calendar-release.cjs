// Release blocker: new personal calendar data must be isolated per account
// and migrated before any Android release that includes the feature.
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname,"..");
const calendar = path.join(root,"src/components/gentle-calendar.jsx");
if (!fs.existsSync(calendar)) {
  console.log("No new gentle calendar; release gate passed.");
  process.exit(0);
}
const code=fs.readFileSync(calendar,"utf8");
const usesGlobalKeys=code.includes('plushlife:device-calendar:v1') || code.includes('plushlife:device-calendar-completion:v1');
const hasVerifiedAccountSync = fs.existsSync(path.join(root,"docs/gentle-calendar-release-certified.json")) &&
  (()=>{try {const status=JSON.parse(fs.readFileSync(path.join(root,"docs/gentle-calendar-release-certified.json"),"utf8"));return status.accountScopedSync===true && status.multiAccountIsolationTested===true && status.migrationTested===true && status.androidSmokeTested===true;}catch{return false;}})();
if (usesGlobalKeys || !hasVerifiedAccountSync) {
  console.error("BLOCKED: calendar stores personal records in shared device keys or lacks verified account sync, migration, isolation and Android QA. Do not publish.");
  process.exit(1);
}
console.log("Gentle calendar release gate passed.");
