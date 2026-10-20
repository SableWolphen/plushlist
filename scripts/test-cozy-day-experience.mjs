import assert from "node:assert/strict";
import fs from "node:fs";
import { buildSync } from "esbuild";
import { buildCozyDayPlan, ROUTINE_TEMPLATES, weeklyCozyStory, shareableCozyStory, safeHomeMode } from "../src/cozy-day-plan.mjs";
const rows=[
 {key:"a",label:"Take medication",sourceTask:{estimated_minutes:2,essential_on_low_capacity:true}},
 {key:"b",label:"Brush teeth",sourceTask:{estimated_minutes:5,tiny_label:"Use mouthwash"}},
 {key:"c",label:"Tidy room",sourceTask:{estimated_minutes:20}},
 {key:"d",label:"Make a snack",isBonus:true,sourceTask:{estimated_minutes:15}},
 {key:"e",label:"Stretch",isBonus:true}
];
const full=buildCozyDayPlan({rows,viewDone:{a:true},minutesAvailable:10});
assert.deepEqual(full.essentials.map(x=>x.key),["b","c"]);
assert.equal(full.overloaded,true);
assert.equal(full.totalMinutes,45);
assert.equal(full.essentials[0].tiny,"Use mouthwash");
const tiny=buildCozyDayPlan({rows,viewDone:{a:true},mode:"tiny"});
assert.equal(tiny.essentials.length,1);
assert.equal(tiny.essentials[0].key,"b");
assert.equal(buildCozyDayPlan({rows,mode:"rest"}).essentials.length,0);
assert.equal(buildCozyDayPlan({rows:[]}).essentials.length,0);
assert.equal(buildCozyDayPlan({rows:[{key:"z",label:"Unestimated",sourceTask:{estimated_minutes:-1}}]}).suggestedMinutes,5);
assert.deepEqual(buildCozyDayPlan({rows:[
 {key:"paused",label:"Pause me",sourceTask:{paused_since:"2026-10-12",paused_until:"2026-10-18"}},
 {key:"ready",label:"Active"}
],date:"2026-10-13"}).essentials.map(x=>x.key),["ready"],"Temporarily paused tasks must not be recommended");
assert.equal(safeHomeMode("companion"),"companion");
assert.equal(safeHomeMode("untrusted"),"minimal");
assert.equal(ROUTINE_TEMPLATES.length,6);
assert.equal(new Set(ROUTINE_TEMPLATES.map(t=>t.id)).size,6);
const history=[
 {progress_date:"2026-10-12",completed_keys:["a","b","b"]},
 {progress_date:"2026-10-12",completed_keys:["b","c"]},
 {progress_date:"2026-10-01",completed_keys:["a"]},
 {progress_date:"2026-10-14",completed_keys:["sensitive"]},
];
const story=weeklyCozyStory({history,checkIns:[{check_date:"2026-10-11",mood:"low"},{check_date:"2026-10-15",mood:"great"}],today:"2026-10-13"});
assert.equal(story.stepCount,3,"Duplicate server history must not inflate wins");
assert.equal(story.caringDays,2);
const shared=shareableCozyStory(story);
assert.ok(shared.includes("3 little steps"));
assert.ok(!shared.includes("Take medication")&&!shared.includes("low")&&!shared.includes("sensitive"),"Sharing must not leak task/journal/mood content");
assert.equal(weeklyCozyStory({today:"invalid"}),null);
const build=buildSync({entryPoints:["src/components/cozy-day-experience.jsx"],bundle:true,write:false,format:"esm",platform:"browser",target:"es2022"});
assert.ok(build.outputFiles?.[0]?.text.includes("Your little plan"));
const today=fs.readFileSync("src/components/today-panel-core.jsx","utf8");
const progress=fs.readFileSync("src/components/progress-panel-core.jsx","utf8");
const tasks=fs.readFileSync("src/components/tasks-panel.jsx","utf8");
const onboarding=fs.readFileSync("src/components/gentle-onboarding.jsx","utf8");
const app=fs.readFileSync("src/app-source.jsx","utf8");
assert.ok(today.includes("<CozyDayHome userId={userId}"),"Home should show the new plan");
assert.ok(progress.includes("<CozyWeeklyStory userId={user?.id}"),"Progress should show the weekly story");
assert.ok(tasks.includes("<RoutineStarter onChoose="),"Templates must be wired to safe task import");
assert.ok(onboarding.includes("onFirstTask"),"Onboarding must allow a first choice");
assert.ok(app.includes("task:onboardingFirstTask.trim()"),"First task must be persisted on onboarding");
assert.ok((app.match(/MAIN_DESTINATIONS.map/g)||[]).length === 2,"Keep five clear bottom navigation destinations, including Guardian");
console.log("Cozy day experience tests passed: adaptive daily plan, focus wiring, privacy-safe story, routine preview and first-use onboarding.");
