import assert from "node:assert/strict";import fs from "node:fs";
const src=fs.readFileSync("src/components/plush-guardian-settings.jsx","utf8");
for(const title of ["Make Guardian yours","Care, surprises & boundaries","More ways to personalize Guardian","Automatic reminders"]) assert.ok(src.includes(title),title);
assert.equal((src.match(/className="[^"]*pl-guardian-advanced/g)||[]).length,3);
for(const key of ["surpriseBox","guardianPaused","automaticGifts","careMode","littleMode","careReminders","automaticReminders","quietStart","quietEnd"])assert.ok(src.includes(key),"Missing preserved setting "+key);
assert.ok(src.includes('<summary>🍼 Care, surprises & boundaries</summary>'));
assert.doesNotMatch(src,/<details[^>]*open[\s=>]/);
console.log("Guardian simplified settings source checks passed");