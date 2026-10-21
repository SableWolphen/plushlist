import assert from "node:assert/strict";import fs from "node:fs";
const src=fs.readFileSync("src/components/plush-guardian-settings.jsx","utf8");
for(const title of ["My Guardian 🧸","Care & Little Mode","Letters & Support","Rewards & Surprises","Reminders","Personalize Guardian"])assert.ok(src.includes(title),title);
for(const area of ["home","care","rewards","letters","reminders","personalize"])assert.ok(src.includes('area === "'+area+'"'));
for(const key of ["surpriseBox","guardianPaused","automaticGifts","careMode","littleMode","careReminders","automaticReminders","quietStart","quietEnd"])assert.ok(src.includes(key),"Missing preserved setting "+key);
assert.match(src,/Back to Guardian settings/);
console.log("Guardian settings hub source checks passed");
