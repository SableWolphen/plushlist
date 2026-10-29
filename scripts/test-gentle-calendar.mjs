import assert from "node:assert/strict";
import { calendarOccurrences } from "../src/gentle-calendar.mjs";
const bill = { id:"rent", title:"Pay rent",date:"2026-01-31",repeat:"monthly" };
assert.deepEqual(calendarOccurrences([bill],"2026-02-01","2026-02-28").map(x=>x.occurrence),["2026-02-28"]);
assert.deepEqual(calendarOccurrences([{...bill,repeat:"weekly",date:"2026-10-01"}],"2026-10-01","2026-10-15").map(x=>x.occurrence),["2026-10-01","2026-10-08","2026-10-15"]);
assert.equal(calendarOccurrences([{...bill,repeat:"daily"}],"2026-01-31","2026-02-02").length,3);
assert.equal(calendarOccurrences([{...bill,repeat:"once"}],"2026-02-01","2026-02-28").length,0);
console.log("Gentle calendar recurrence tests passed");

import { brainDumpLines, importantUpcoming, occurrenceKey, GENTLE_TEMPLATES } from "../src/gentle-calendar.mjs";
assert.deepEqual(brainDumpLines("  Pay rent; Call dentist\n- Put bins out"),["Pay rent","Call dentist","Put bins out"]);
assert.equal(brainDumpLines("   ").length,0);
assert.equal(GENTLE_TEMPLATES.length>=4,true);
const upcoming=importantUpcoming([{...bill, date:"2026-10-25",important:true}],"2026-10-23",7);
assert.equal(upcoming.length,1);
assert.equal(occurrenceKey(upcoming[0]),"rent:2026-10-25");
assert.deepEqual(calendarOccurrences([bill],"bad","2026-02-28"),[]);
