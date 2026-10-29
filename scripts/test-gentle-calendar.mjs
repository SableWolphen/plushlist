import assert from "node:assert/strict";
import { calendarOccurrences } from "../src/gentle-calendar.mjs";
const bill = { id:"rent", title:"Pay rent",date:"2026-01-31",repeat:"monthly" };
assert.deepEqual(calendarOccurrences([bill],"2026-02-01","2026-02-28").map(x=>x.occurrence),["2026-02-28"]);
assert.deepEqual(calendarOccurrences([{...bill,repeat:"weekly",date:"2026-10-01"}],"2026-10-01","2026-10-15").map(x=>x.occurrence),["2026-10-01","2026-10-08","2026-10-15"]);
assert.equal(calendarOccurrences([{...bill,repeat:"daily"}],"2026-01-31","2026-02-02").length,3);
assert.equal(calendarOccurrences([{...bill,repeat:"once"}],"2026-02-01","2026-02-28").length,0);
console.log("Gentle calendar recurrence tests passed");
