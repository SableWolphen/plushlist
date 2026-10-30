import assert from "node:assert/strict";
import { gentleBriefing,parseSpokenReminder } from "../src/gentle-everyday-assistant.mjs";
const items=[{id:"bill",title:"Pay rent",date:"2026-10-30",repeat:"monthly",category:"bill",important:true},{id:"wash",title:"Wash dishes",date:"2026-10-29",repeat:"once",category:"home"}];
const b=gentleBriefing(items,{},"2026-10-29");
assert.equal(b.essential[0].title,"Pay rent");
assert.equal(b.next.title,"Wash dishes");
assert.equal(gentleBriefing(items,{"bill:2026-10-30":true},"2026-10-29").essential.length,0);
assert.deepEqual(parseSpokenReminder("remind me to pay electricity every month on the 15th"),{title:"pay electricity",repeat:"monthly",dayOfMonth:15,needsReview:true});
console.log("Gentle everyday assistant checks passed.");
