const assert = require('node:assert/strict');
const React = require('react');
const {create, act} = require('react-test-renderer');
const {buildSync} = require('esbuild');
const vm = require('node:vm');
const fs = require('node:fs');

// Exercise the actual workspace components; isolate unrelated storage and art.
function load(file, replacements, scope) {
  let source = fs.readFileSync(file, 'utf8');
  for (const [pattern, replacement] of replacements) source = source.replace(pattern, replacement);
  const result = buildSync({stdin:{contents:source,resolveDir:process.cwd()+'/src/components',loader:'jsx'},bundle:true,write:false,format:'cjs',platform:'node'});
  const context = {module:{exports:{}}, React, console, window:scope.window, ...scope};
  vm.runInNewContext(result.outputFiles[0].text,context);
  return context.module.exports;
}
const content = {
  COMFORT_TOOLS:[{id:'breathe',name:'Breathing',icon:'🌿'}],
  PLUSH_PATHS:[{id:'path',title:'Small steps',days:[{}]}],
  SLEEP_TOOLS:[{id:'sleep',title:'Wind down'}], SOUNDSCAPES:[], GENTLE_AFFIRMATIONS:['Rest'], DAYS:[],
};
const scope = {window:{PlushLifeContent:content,PlushLifeSchedule:{pathOfTheWeekId:()=> 'path',dayIdForDate:()=> 'tue',formatTime12:x=>x},PlushLifeHelpers:{formatRelativeTime:()=> 'recently'}}};
const {CarePanel} = load('src/components/care-panel.jsx',[
  [/import \{ CozySpace \}[^;]+;/, 'const CozySpace=()=>null;'],
  [/import \{ CareHistory \}[^;]+;/, 'const CareHistory=()=>React.createElement("p",null,"Saved history");'],
  [/import \{ EXTRA_PLUSH_PATHS \}[^;]+;/, 'const EXTRA_PLUSH_PATHS=[];'],
  [/import \{ hasGoldFeature \}[^;]+;/, 'const hasGoldFeature=()=>false;'],
  [/import \{ addCaringDay[^;]+;/, 'const addCaringDay=()=>{},localDay=()=>"2026-10-20",recordMoment=()=>{},recordPathFeedback=()=>{},pathAdaptation=()=>null,sleepMemory=()=>({}),supportMemory=()=>({});'],
  [/import \{ beginRecommendation[^;]+;/, 'const beginRecommendation=()=>{},profileContext=()=>({}),recommendationFit=()=>null,recordRecommendationOutcome=()=>{},syncSessionOutcomes=()=>{};'],
],scope);
let care, started=[],selectedPaths=[];
function Harness(){const [careSection,setCareSection]=React.useState('quick');return React.createElement(CarePanel,{open:true,user:{id:'cozy'},careSection,setCareSection,HELP_ME_NOW_OPTIONS:[],careSessionHistory:[],pathProgress:[],period:{weekStart:'2026-10-19'},openCareSession:id=>started.push(id),setSleepToolOpen:id=>started.push(id),setSelectedCarePath:id=>selectedPaths.push(id)});}
const text = tree => JSON.stringify(tree.toJSON());
const button = (tree,label) => tree.root.findAllByType('button').find(n=>n.children.join('')===label);
act(()=>{care=create(React.createElement(Harness));});
assert.equal(care.root.findAllByProps({'aria-label':'Care sections'}).length,1);
assert.equal(care.root.findAllByProps({'aria-label':'Care library'}).length,0,'No nested section switcher');
act(()=>button(care,'🌿 Breathe').props.onClick());
assert.deepEqual(started,['breathe']);
act(()=>button(care,'Sleep').props.onClick());
assert(text(care).includes('Wind down'),'Sleep tools appear directly');
assert(!text(care).includes('What do I need right now?'));
act(()=>care.root.findAllByType('button').find(n=>n.children.includes('Wind down')).props.onClick());
assert.equal(started.at(-1),'sleep');
act(()=>button(care,'Guided steps').props.onClick());
assert(text(care).includes('Small steps'));
act(()=>button(care,'History').props.onClick());
assert(text(care).includes('Saved history'));
assert(!text(care).includes('Small steps'),'History replaces tool browsing');
act(()=>care.unmount());

const {GuardianPanel}=load('src/components/guardian-panel.jsx',[
  [/import \{ CozySharing, SharedCozyCard \}[^;]+;/,'const CozySharing=()=>React.createElement("p",null,"Shared card"),SharedCozyCard=CozySharing;'],
  [/import \{ CozyRewardWishlist \}[^;]+;/,'const CozyRewardWishlist=()=>null;'],
  [/import \{ ToolPanel \}[^;]+;/,'const ToolPanel=({children})=>React.createElement("div",null,children);'],
  [/import \{ CozyScene \}[^;]+;/,'const CozyScene=()=>null;'],
  [/import \{ openPlushGuardian, useGuardianState \}[^;]+;/,'const openPlushGuardian=()=>{},useGuardianState=()=>({prefs:{automaticReminders:true}});'],
],scope);
let sent=0,permissionChanges=0,rewardsUsed=[];
const link={id:'link',owner_user_id:'cozy',caregiver_email:'guardian@example.invalid',active:true,accepted_at:'date',can_view_progress:true};
const props={open:true,user:{id:'cozy'},guardianLinksReady:true,supportViewMode:'mine',supportOwnerId:'cozy',ownedSupportLinks:[link],period:{date:'2026-10-20'},supportPercent:100,supportWeeklyPercent:100,supportRequestType:'company',supportRequestText:'',supportRewards:[{id:'ready',title:'Ready gift',target_percent:75},{id:'pending',title:'Approval gift',target_percent:75,approval_required:true}],supportNotes:[],supportMessage:'',restDatesSet:new Set(),supportRequestGuardian:'',suggestionSectionsById:{},sendGuardianSupportRequest:()=>sent++,updateCaretakerPermission:()=>permissionChanges++,updateRewardStatus:(reward)=>rewardsUsed.push(reward.id),setSupportRequestGuardian(){},setSupportRequestType(){},setSupportRequestText(){}};
for(const name of ['pendingSupportInvites','supportPeople','invitedSupportLinks','supportRelationships','guardianSupportRequests','supportAchievements','supportDailyEssentialKeys','supportScheduledTodayKeys','taskSuggestions','GUARDIAN_ROLE_PRESETS'])props[name]=[];
let guardian;
act(()=>{guardian=create(React.createElement(GuardianPanel,props));});
assert(button(guardian,'Send support request'),'Request composer is on the default screen');
assert.equal(guardian.root.findAllByProps({className:'pl-human-guardian-rewards'}).length,1);
assert.equal(button(guardian,'Use reward 🎁')!==undefined,true);
assert.equal(guardian.root.findAllByType('button').filter(n=>n.children.join('')==='Use reward 🎁').length,1,'Unapproved gift cannot be used');
act(()=>button(guardian,'Use reward 🎁').props.onClick());
assert.deepEqual(rewardsUsed,['ready']);
const section = label => guardian.root.findByProps({'aria-label':'Guardian sections'}).findAllByType('button').find(n=>n.findAllByType('span').at(-1).children.join('')===label);
act(()=>section('Sharing').props.onClick());
assert(text(guardian).includes('Sharing & care agreement'));
assert(!button(guardian,'Send support request'),'Sharing contains controls, not a second support composer');
assert.equal(sent,0);assert.equal(permissionChanges,0,'Navigation never changes consent');
act(()=>section('Support').props.onClick());
act(()=>button(guardian,'Send support request').props.onClick());
assert.equal(sent,1,'Only explicit submission sends a request');
act(()=>guardian.update(React.createElement(GuardianPanel,{...props,user:{id:'other'},ownedSupportLinks:[],supportRewards:[]})));
assert(!text(guardian).includes('guardian@example.invalid'),'Account switch drops previous relationship');
assert(!button(guardian,'Send support request'),'No request sent to a previous account’s Guardian');
const caretaker={...props,user:{id:'guardian'},supportViewMode:'caretaker',isSupportAdult:true,canViewSupportProgress:true,canSendSupportNotes:true,canAddSupportRewards:true,activeSupportLink:{can_suggest_tasks:true},supportProgress:[],supportProgressView:'daily',selectedSupportName:'Cozy',displayedSupportPercent:25,displayedSupportCompleted:1,displayedSupportPossible:4,supportDailyEssentialCompleted:1,supportScheduledTodayCompleted:0,supportTodayDayLabel:'Tuesday'};
act(()=>guardian.update(React.createElement(GuardianPanel,caretaker)));
assert(text(guardian).includes('read-only access'),'Caregiver sees shared progress on landing');
assert(button(guardian,'Send note 💛'),'One help composer opens by default');
const action = label => guardian.root.findByProps({'aria-label':'Support actions'}).findAllByType('button').find(n=>n.findAllByType('span').at(-1).children.join('')===label);
act(()=>action('Task').props.onClick());
assert(guardian.root.findAllByProps({'aria-label':'Task suggestion'}).length===1);
assert(!button(guardian,'Send note 💛'),'Help forms replace each other');
act(()=>guardian.update(React.createElement(GuardianPanel,{...caretaker,canViewSupportProgress:false,canSendSupportNotes:false,canAddSupportRewards:false,activeSupportLink:{can_suggest_tasks:false}})));
assert(text(guardian).includes('Progress sharing is turned off'));
assert(!text(guardian).includes('read-only access'));
assert(!guardian.root.findAllByProps({'aria-label':'Task suggestion'}).length,'Revocation removes the current composer');
act(()=>guardian.unmount());
console.log('Care/Guardian workspaces passed: direct tools, one menu, default requests, reward approval, sharing isolation and account switching.');
