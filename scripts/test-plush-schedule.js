const assert = require("node:assert/strict");
const schedule = require("../assets/plush-schedule.js");

// Time formatting round-trips.
assert.equal(schedule.formatTime12("14:30"), "2:30 PM");
assert.equal(schedule.formatTime12("00:05"), "12:05 AM");
assert.equal(schedule.formatTime12(""), "");
assert.equal(schedule.parseTime24("2:30 PM"), "14:30");
assert.equal(schedule.parseTime24("12:05 AM"), "00:05");
assert.equal(schedule.parseTime24("not a time"), "");

// dayIdForDate must line up with the real UTC weekday.
assert.equal(schedule.dayIdForDate("2026-08-10"), "mon");
assert.equal(schedule.dayIdForDate("2026-08-11"), "tue");
assert.equal(schedule.dayIdForDate("2026-08-16"), "sun");

// offsetDate/monthKeyOffset never overflow into the wrong month.
assert.equal(schedule.offsetDate("2026-08-31", 1), "2026-09-01");
assert.equal(schedule.monthKeyOffset("2026-01-31", 1), "2026-02");
assert.equal(schedule.monthKeyOffset("2026-03-15", -1), "2026-02");

// daysInCalendarMonth / datesInMonthThrough basics.
assert.equal(schedule.daysInCalendarMonth("2026-02"), 28);
assert.equal(schedule.daysInCalendarMonth("2028-02"), 29);
assert.equal(schedule.datesInMonthThrough("2026-02", null).length, 28);
assert.equal(schedule.datesInMonthThrough("2026-02", "2026-02-10").length, 10);

// daysBetweenDates.
assert.equal(schedule.daysBetweenDates("2026-08-01", "2026-08-11"), 10);
assert.equal(schedule.daysBetweenDates(null, "2026-08-11"), null);

// habitTypeForTask / cleanTaskDetail / encodeTaskDetail round-trip.
assert.equal(schedule.habitTypeForTask({ detail: "[[plushlist-habit:build]] Drink water" }), "build");
assert.equal(schedule.habitTypeForTask({ detail: "Drink water" }), "regular");
assert.equal(schedule.cleanTaskDetail("[[plushlist-habit:build]] Drink water"), "Drink water");
assert.equal(schedule.encodeTaskDetail("build", "Drink water"), "[[plushlist-habit:build]] Drink water");
assert.equal(schedule.encodeTaskDetail("regular", "Drink water"), "Drink water");

// taskOccursOn respects schedule_type once/range.
assert.equal(schedule.taskOccursOn({ schedule_type: "once", one_time_date: "2026-08-11" }, "2026-08-11"), true);
assert.equal(schedule.taskOccursOn({ schedule_type: "once", one_time_date: "2026-08-11" }, "2026-08-12"), false);
assert.equal(schedule.taskOccursOn({ schedule_type: "range", start_date: "2026-08-01", end_date: "2026-08-31" }, "2026-08-15"), true);
assert.equal(schedule.taskOccursOn({ schedule_type: "range", start_date: "2026-08-01", end_date: "2026-08-31" }, "2026-09-01"), false);

// taskIsOptional checks is_bonus and section markers.
assert.equal(schedule.taskIsOptional({ is_bonus: true }), true);
assert.equal(schedule.taskIsOptional({ section: "Bonus wins" }), true);
assert.equal(schedule.taskIsOptional({ section: "Morning" }), false);

// scheduleLabelForTask covers the every-day/weekday/weekend shortcuts.
assert.equal(schedule.scheduleLabelForTask({ schedule_days: ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] }), "Every day");
assert.equal(schedule.scheduleLabelForTask({ schedule_days: ["mon", "tue", "wed", "thu", "fri"] }), "Weekdays");
assert.equal(schedule.scheduleLabelForTask({ schedule_days: ["sat", "sun"] }), "Weekend");

// pathOfTheWeekId always returns a real PLUSH_PATHS id.
const plushContent = require("../assets/plush-content.js");
const pathIds = plushContent.PLUSH_PATHS.map((path) => path.id);
assert.ok(pathIds.includes(schedule.pathOfTheWeekId("2026-08-10")));

console.log("plush-schedule tests passed");
