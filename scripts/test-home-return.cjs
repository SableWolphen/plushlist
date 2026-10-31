const assert=require('node:assert/strict'),fs=require('fs'),os=require('os'),path=require('path');
const React=require('react'),Renderer=require('react-test-renderer');global.React=React;
global.window=new EventTarget();global.document=new EventTarget();document.getElementById=()=>({});global.navigator={};
window.PlushLifeContent=require('../assets/plush-content.js');window.PlushLifeThemeCopy=require('../assets/plush-theme-copy.js');window.PlushLifeHelpers=require('../assets/plush-helpers.js');window.clearTimeout=clearTimeout;window.setTimeout=setTimeout;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'home-return-'));
require('esbuild').buildSync({entryPoints:['src/components/today-panel-core.jsx'],bundle:true,platform:'node',format:'cjs',outfile:path.join(dir,'core.cjs')});
const {TodayPanel}=require(path.join(dir,'core.cjs'));
let softer=null,dismissed=false;
const props={open:true,period:{date:'2026-09-30'},rows:[],viewDone:{},preferences:{home_layout:{order:['tiny'],hidden:['tasks','habits','schedule','shortcuts','noticed']}},returnGapDays:4,selectDayType:v=>softer=v,setReturnBannerDismissed:v=>dismissed=v,selectedOutfit:window.PlushLifeContent.MASCOT_OUTFITS[0]};
const {act}=Renderer;let tree;
act(()=>{tree=Renderer.create(React.createElement(TodayPanel,props));});
assert.ok(JSON.stringify(tree.toJSON()).includes('Welcome back, Cozy.'));
act(()=>{tree.root.findAllByType('button').find(n=>n.children.join('')==='Make today softer →').props.onClick();});
assert.equal(softer,'tiny');assert.equal(dismissed,true);
for(const view of [{returnBannerDismissed:true},{isHistoricalView:true},{isFutureView:true},{returnGapDays:1}]){
  act(()=>tree.update(React.createElement(TodayPanel,{...props,...view})));
  assert.ok(!JSON.stringify(tree.toJSON()).includes('Welcome back, Cozy.'));
}
let editing=null;
const entries=Array.from({length:6},(_,i)=>({id:String(i),time:`0${i+4}:00`,text:`A complete schedule event ${i}`}));
const rows=Array.from({length:4},(_,i)=>({key:`task-${i}`,label:`A caring task ${i}`}));
act(()=>tree.update(React.createElement(TodayPanel,{...props,preferences:{},selectedSchedule:{entries},rows,setManageSchedule:value=>editing=value})));
// Home shows the schedule once, in the storybook "Today’s schedule" section (no second tabbed agenda).
assert.equal(tree.root.findAllByProps({className:'pl-home-day-card'}).length,0,'No duplicate agenda inside More for today');
const schedule=tree.root.findByProps({className:'pl-storybook-schedule'});
assert.equal(schedule.findAllByProps({className:'pl-list-row pl-schedule-row'}).length,6,'Full schedule remains visible');
act(()=>schedule.findByProps({'aria-label':'Edit today’s schedule'}).props.onClick());assert.equal(editing,true);
assert.equal(tree.root.findAllByProps({className:'pl-storybook-schedule'}).length,1,'Schedule appears exactly once');
assert.equal(schedule.findAllByProps({className:'pl-storybook-schedule-next'}).length<=1,true,'Next-up hint lives in the schedule summary');
act(()=>tree.unmount());
console.log('Home return passed: gentle greeting, user-chosen Tiny day, dismissal, and current-day-only display.');

// The companion responds to tap/completion events, without moving the welcome card.
const reactionTimers=[];window.setTimeout=(fn,delay)=>{if(delay===2200){reactionTimers.push(fn);return 99999;}return setTimeout(fn,delay);};
act(()=>{tree=Renderer.create(React.createElement(TodayPanel,{...props,preferences:{},returnGapDays:0}));});
const pat=()=>tree.root.findByProps({'aria-label':'Say hi to your plush'});
act(()=>window.dispatchEvent(Object.assign(new Event('plushlife:task-completion-feedback'),{detail:{completed:false}})));
assert.ok(!JSON.stringify(tree.toJSON()).includes('soft-happy.svg'),'Undo does not trigger a celebration');
act(()=>pat().props.onClick());
assert.ok(JSON.stringify(tree.toJSON()).includes('soft-happy.svg'));
assert.ok(pat().props.className.includes('pl-mascot-happy-hop'));
assert.ok(!tree.root.findByProps({'aria-label':'PlushLife welcome'}).props.className.includes('mascot-celebrating'));
act(()=>window.dispatchEvent(Object.assign(new Event('plushlife:task-completion-feedback'),{detail:{completed:true,label:'Water'}})));
assert.ok(JSON.stringify(tree.toJSON()).includes('Tiny win. Big happy dance!'));
act(()=>tree.update(React.createElement(TodayPanel,{...props,preferences:{reduced_motion:true},returnGapDays:0})));
assert.ok(!pat().props.className.includes('pl-mascot-happy-hop'));
assert.ok(JSON.stringify(tree.toJSON()).includes('soft-happy.svg'),'Reduced motion retains the happy expression');
act(()=>reactionTimers.at(-1)());
assert.ok(!JSON.stringify(tree.toJSON()).includes('soft-happy.svg'),'Expression returns to neutral after the brief reaction');
act(()=>tree.unmount());
window.setTimeout=setTimeout;
fs.rmSync(dir,{recursive:true,force:true});
