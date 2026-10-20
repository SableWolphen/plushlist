import assert from "node:assert/strict";
import fs from "node:fs";
import { buildSync } from "esbuild";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createRequire } from "node:module";
const source=fs.readFileSync("src/components/storybook-home.jsx","utf8");
const page=fs.readFileSync("src/components/today-panel-core.jsx","utf8");
const css=fs.readFileSync("assets/storybook-themes.css","utf8");
const html=fs.readFileSync("index.html","utf8");
const sync=fs.readFileSync("scripts/sync-www.js","utf8");
const app=fs.readFileSync("src/app-source.jsx","utf8");
const theme=fs.readFileSync("src/components/theme-world.jsx","utf8");
const build=buildSync({entryPoints:["src/components/storybook-home.jsx"],bundle:true,write:false,format:"esm",platform:"browser",target:"es2022",loader:{".jsx":"jsx"}});
assert.ok(build.outputFiles?.[0]?.text.includes("Good morning, Cozy!"),"Storyboard JSX must bundle");
assert.ok(page.includes("<StorybookHome world="),"Real Home must render storyboard");
assert.ok(page.includes("<CozyDayHome userId="),"Adaptive Focus must remain reachable");
assert.ok(page.includes("<DayRescue currentMode="),"Soft / Tiny / Rest modes must remain reachable");
for(const mode of ["baby","dino","soft","meadow","strawberry","twilight"]) {
 assert.ok(source.includes(mode+":"),"World "+mode+" must have unique copy");
 assert.ok(css.includes('data-pl-world="'+mode+'"'),"World "+mode+" must have page atmosphere rules");
}
assert.ok(source.includes("<ThemeScene decorative focus"),"Use the actual repository mascot instead of introducing a rabbit image");
assert.ok(theme.includes('const mascotWorld = "soft"'),"Mascot identity remains locked");
assert.ok(source.includes("toggle?.(row.key)")&&source.includes("viewDone[row.key]"),"Checkmarks must use saved task state");
assert.ok(source.includes("openDailyCheckIn?.()")&&source.includes("openTodayJournal?.()"));
assert.ok(source.includes('plushlife:focus-one-step'),"Focus button must open actual Focus Mode");
assert.ok(source.includes("goToDashboard?.(\"week\")"),"Date button must open real calendar");
assert.ok(!source.includes('src="data:'),"Never inline simulated task screenshots");
assert.ok(html.includes('storybook-themes.css'),"The theme stylesheet must actually ship");
assert.ok(sync.includes("BOOT_RECOVERY_SCRIPT"),"App shell must not freeze with no recovery");
assert.ok(sync.includes('id="plush-boot-retry"')||sync.includes('retry.id = "plush-boot-retry"'),"Retry should be available to the user");
assert.ok(app.includes('authWait = window.setTimeout'),"Session startup needs a bounded wait");
assert.ok(app.includes('setSyncStatus(status => status === "loading" ? "signed-out" : status)'));
globalThis.React = React;
globalThis.window = { PlushLifeThemeCopy: { worlds: {} } };
window.PlushLifeSchedule=createRequire(import.meta.url)('../assets/plush-schedule.js');
const { StorybookHome, storybookRows, storybookGreeting, homeTaskPriority } = await import('data:text/javascript;base64,' + Buffer.from(build.outputFiles[0].text).toString('base64'));
const tasks = Array.from({length:16}, (_,i)=>({key:'task-'+i,label:'Task '+i}));
assert.equal(storybookRows(tasks).length, 3, 'Home keeps a manageable three-task preview');
const prioritized = [
  {key:"later",label:"Later task"},
  {key:"small",label:"Quick task",sourceTask:{estimated_minutes:5}},
  {key:"urgent",label:"Timed",sourceTask:{reminder_time:"12:10"}},
  {key:"essential",label:"Essential",sourceTask:{essential:true}},
];
assert.deepEqual(storybookRows(prioritized,{},3,12*60).map(row=>row.key),["essential","urgent","small"],"Home highlights essentials, nearby reminders and smaller wins");
assert.ok(homeTaskPriority(prioritized[3]) > homeTaskPriority(prioritized[0]));
assert.ok(source.includes("pl-storybook-world-win"), "Completed days celebrate in the chosen theme");
assert.ok(source.includes("weeklyCozyStory"), "Weekly story must use existing saved activity instead of a new tracker");
assert.ok(source.includes("hasWeeklyStory"), "Weekly story should stay hidden until someone has caring days");
assert.ok(page.includes("weeklyHistory={weeklyHistory}"), "Real Home must receive saved activity history");
assert.ok(app.includes("dailyCheckInHistory={dailyCheckInHistory}"), "Weekly story must only use the signed-in Cozy check-ins");
assert.ok(source.includes('dayType === "rest" ? 0'), "Rest days must show no pressured task list");
assert.ok(source.includes('dayType === "tiny" ? 1'), "Tiny days must show just one suggested task");
assert.ok(source.includes('["soft","recovery"].includes(dayType) ? 2'), "Soft days need at most two suggestions");
assert.ok(source.includes('Rest counts.'), "Rest day must be reassuring instead of an empty-task prompt");
assert.ok(page.includes('dayType={dailyCheckIn?.day_type || "full"}'), "Home must receive real daily capacity from Care");
const habitSource={task_key:'water',detail:'[[plushlist-habit:build]] Drink a glass after breakfast'};
const habitGoal={target:3,unit:'cups',value:1};
const habitPreview=storybookRows([{key:'water',label:'Drink water',sourceTask:habitSource,goal:habitGoal},{key:'scroll',label:'Less scrolling',habitType:'reduce'}]);
assert.equal(habitPreview[0].habitType,'build','Home must preserve habit identity from persisted task metadata');
assert.equal(habitPreview[0].sourceTask,habitSource);
assert.equal(habitPreview[0].goal,habitGoal,'Home must preserve real measurement progress');
assert.equal(habitPreview[1].habitType,'reduce');
assert.deepEqual(storybookRows(tasks, {'task-0':true}).map(row=>row.key), ['task-1','task-2','task-3'], 'Completing a task brings the next unfinished task into Home');
assert.ok(storybookRows(tasks, Object.fromEntries(tasks.map(row=>[row.key,true]))).every(row=>row.done), 'An entirely completed day still shows real completed state');
assert.deepEqual(storybookRows([{key:'bonus',label:'Bonus',isBonus:true},{key:'old',label:'Old',sourceTask:{archived_at:'2026-10-13'}},{key:'next',label:'Next'}]).map(row=>row.key), ['next']);
assert.equal(storybookGreeting(8), 'Good morning, Cozy!');
assert.equal(storybookGreeting(15), 'Good afternoon, Cozy!');
assert.equal(storybookGreeting(23), 'Good evening, Cozy!');
const atmosphereBuild=buildSync({entryPoints:['src/theme-atmosphere.js'],bundle:true,write:false,format:'esm'});
const {THEME_ATMOSPHERES,themeAtmosphere,DARK_THEME_PALETTES}=await import('data:text/javascript;base64,'+Buffer.from(atmosphereBuild.outputFiles[0].text).toString('base64'));
assert.equal(themeAtmosphere('none').scene,null);
assert.equal(themeAtmosphere('unknown').scene,null,'Unknown settings must fall back to a neutral world');
const scenes=Object.entries(THEME_ATMOSPHERES).filter(([,value])=>value.scene);
assert.equal(new Set(scenes.map(([,value])=>value.scene)).size,scenes.length,'Themes cannot share the same backdrop');
for(const [world,atmosphere] of scenes){
  assert.ok(fs.existsSync('assets/worlds/'+atmosphere.scene+'.svg'),world+' needs shipped scenery');
  assert.ok(DARK_THEME_PALETTES[world]?.surface,world+' needs its own dark palette');
}
console.log("Teddy Storybook Home and startup-recovery regressions passed.");

const expanded = storybookRows(tasks, {'task-0':true,'task-4':true}, tasks.length, 720, true);
assert.equal(expanded.length,tasks.length,'Expanded Today includes the whole list, without leaving the page');
assert(expanded.slice(-2).every(row=>row.done),'Completed tasks stay visible at the end of the expanded list');
assert.equal(storybookRows([{key:'bonus',label:'Bonus',isBonus:true},{key:'old',label:'Old',sourceTask:{archived_at:'2026-10-13'}}],{},100,720,true).length,0);
window.PlushLifeThemeCopy.worlds.soft = {asset:"soft"};
let dailyMarkup;
try { dailyMarkup = renderToStaticMarkup(React.createElement(StorybookHome,{userId:'home-test',rows:tasks,period:{date:'2026-10-20'},schedulePreview:React.createElement('p',null,'09:00 Test schedule')})); } catch(error) { throw new Error('Today render failed: '+error.message); }
assert(dailyMarkup.includes('Show all 16 tasks here'),'Today offers inline expansion');
assert(dailyMarkup.includes('Quickly add a task'),'The real task input is present in Today');
assert(dailyMarkup.includes('09:00 Test schedule'),'The schedule can be read in Today');
assert(!dailyMarkup.includes('When should this happen'),'Today capture avoids timing choices');
assert(!dailyMarkup.includes('More options ↓'),'Today capture avoids another setup menu');
console.log('Today hub passed: inline task list, retained completions, compact capture and schedule.');
