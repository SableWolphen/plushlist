import assert from "node:assert/strict";
import fs from "node:fs";
import { buildSync } from "esbuild";
import { chooseRescueMode, searchPrivateEveryday, buildLittleWins, shouldReviewQuickSchedule } from "../src/everyday-upgrades.mjs";
import { companionAccountKey } from "../src/companion-account-storage.mjs";

assert.equal(chooseRescueMode("soft").mode, "soft");
assert.match(chooseRescueMode("rest").message, /finished tasks stay finished/);
assert.equal(chooseRescueMode("nope"), null, "Unrecognized day types must not be saved");

assert.equal(shouldReviewQuickSchedule("Take vitamins every morning at 8"), true);
assert.equal(shouldReviewQuickSchedule("dentist tomorrow at 2pm"), true);
assert.equal(shouldReviewQuickSchedule("Call a friend on Monday"), true);
assert.equal(shouldReviewQuickSchedule("Brush my teeth"), false);
assert.equal(shouldReviewQuickSchedule("Eat at home"), false);

const tasks = [
  { task_key: "a", task: "Take vitamins", section: "Morning", why_note: "Health" },
  { task_key: "b", task: "Secret archived task", archived_at: "2026-10-12" },
  { task_key: "c", task: "Water plants", section: "Home" },
];
const schedules = [{ day_id: "monday", label: "Monday", entries: [{ text: "Morning walk" }] }];
const notes = [{ note_date: "2026-10-11", body: "I saw a butterfly today", prompt: "A good thing" }];
assert.deepEqual(searchPrivateEveryday({query:"vitamins",tasks,schedules,notes}).map(row=>row.id),["task:a"]);
assert.deepEqual(searchPrivateEveryday({query:"walk",tasks,schedules,notes}).map(row=>row.id),["schedule:monday:0"]);
assert.deepEqual(searchPrivateEveryday({query:"butterfly",tasks,schedules,notes}).map(row=>row.id),["journal:2026-10-11"]);
assert.equal(searchPrivateEveryday({query:"archived",tasks}).length,0);
assert.equal(searchPrivateEveryday({query:"x",tasks}).length,0,"One-letter input should never dump personal entries");
assert.equal(searchPrivateEveryday({query:"unrelated",tasks,schedules,notes}).length,0);
assert.equal(searchPrivateEveryday({query:"walk",tasks,schedules,notes:[]}).some(row=>row.type==="journal"),false,
  "Do not search private journal content unless it was explicitly loaded into this session");
const wins=buildLittleWins({today:"2026-10-12",history:[
  {progress_date:"2026-10-12",completed_keys:["a","c"]},
  {progress_date:"2026-10-11",completed_keys:[]},
  {progress_date:"2026-10-13",completed_keys:["a"]},
],checkIns:[{check_date:"2026-10-11",mood:"okay"},{check_date:"2026-10-13",mood:"good"}]});
assert.deepEqual(wins.map(win=>win.date),["2026-10-12","2026-10-11"]);
assert.match(wins[0].title,/2 little steps/);
assert.ok(!JSON.stringify(wins).includes("2026-10-13"), "Never count future day activity");
assert.notEqual(companionAccountKey("plushlife:little-wins:v1","aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),companionAccountKey("plushlife:little-wins:v1","bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"));

const built=buildSync({entryPoints:["src/components/everyday-upgrades.jsx"],bundle:true,write:false,format:"esm",platform:"browser",target:"es2022"});
assert.ok(built.outputFiles?.[0]?.text.includes("Make today easier"));
const today=fs.readFileSync("src/components/today-panel-core.jsx","utf8");
const app=fs.readFileSync("src/app-source.jsx","utf8");
const progress=fs.readFileSync("src/components/progress-panel-core.jsx","utf8");
const together=fs.readFileSync("src/components/together-corner.jsx","utf8");
const notification=fs.readFileSync("src/native-bridge.js","utf8");
assert.ok(today.includes("<DayRescue currentMode="),"Day rescue is reachable from Home");
assert.ok(app.includes("<EverydayActions userId={user.id}"),"Add/search available across logged-in screens");
assert.ok(app.includes('schedule_type: someday ? "weekly" : "once"') && app.includes("one_time_date: someday ? null : quickDate"),
  "Quick Add Today/Tomorrow must not silently create recurring weekly tasks");
assert.ok(app.includes("littleWinHistory={habitHistory}"),"Little Wins reuse recorded account data");
assert.ok(progress.includes("<LittleWins userId={user?.id}"),"Little Wins is reachable from Progress");
assert.ok(together.includes("Easy shared activity ideas"),"Guardian shared activities have one-tap starters");
assert.ok(notification.includes('title: "Move later · 1 hour"'),"Android reminders expose a clear later choice");
console.log("Everyday upgrade checks passed: safe day rescue, private search, Little Wins, Guardian Together and actionable reminders.");
