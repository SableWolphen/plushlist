import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
const code=readFileSync(new URL("../src/components/gentle-calendar.jsx",import.meta.url),"utf8");
const release=readFileSync(new URL("./check-gentle-calendar-release.cjs",import.meta.url),"utf8");
assert.match(code,/userId/);
assert.match(code,/keyFor\(userId/);
assert.match(code,/writeScope\(userId/);
assert.doesNotMatch(code,/localStorage\.setItem\(storeKey/);
assert.doesNotMatch(code,/localStorage\.setItem\(doneKey/);
assert.match(release,/multiAccountIsolationTested/);
assert.match(release,/androidSmokeTested/);
console.log("Calendar account isolation source guards passed.");

assert.match(code,/gentle_calendar_state/);
assert.match(code,/user_id:userId/);
assert.match(code,/Retry account sync/);
const app=readFileSync(new URL("../src/app-source.jsx",import.meta.url),"utf8");
assert.match(app,/<ScheduleEditorPanel client=\{supabase\} user=\{user\}/);

assert.match(code,/const remove = id =>[\s\S]*?writeScope\(userId,"items",next\); setItems\(next\); itemsRef\.current=next; syncState\(next,doneRef\.current\)/, "Deleting a reminder must sync the updated list");
assert.match(code,/Template added[\s\S]*?\}\}/, "Calendar templates must retain safe save handling");
assert.match(code,/itemsRef\.current=next;syncState\(next,doneRef\.current\);setNotice\("Template added/, "Adding a calendar template must sync the updated list");
