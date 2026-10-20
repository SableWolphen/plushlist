const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const React=require('react');
const {create,act}=require('react-test-renderer');
const {buildSync}=require('esbuild');
function load(file,replace=[]){let contents=fs.readFileSync(file,'utf8');for(const [a,b]of replace)contents=contents.replace(a,b);const code=buildSync({stdin:{contents,resolveDir:process.cwd()+'/src/components',loader:'jsx'},bundle:true,format:'cjs',write:false,platform:'node'}).outputFiles[0].text;const context={module:{exports:{}},React,console,window:new EventTarget()};vm.runInNewContext(code,context);return context.module.exports;}
const {SettingsPanel}=load('src/components/organized-settings.jsx',[
 [/import \{ CozyComfortContext \}[^;]+;/,'const CozyComfortContext=React.createContext(null);'],
 [/import \{ WidgetSettings \}[^;]+;/,'const WidgetSettings=()=>React.createElement("p",null,"Widget controls");'],
 [/import \{ HomeLayoutEditor \}[^;]+;/,'const HomeLayoutEditor=()=>null;'],
 [/import \{ ToolPanel \}[^;]+;/,'const ToolPanel=({children})=>React.createElement("div",null,children);'],
 [/import \{ PlushGoldPreview \}[^;]+;/,'const PlushGoldPreview=()=>null;'],
 [/import \{ RecommendationSettings \}[^;]+;/,'const RecommendationSettings=()=>React.createElement("p",null,"Suggestion privacy");'],
 [/const LazyAppearanceThemePicker[^;]+;/,'const LazyAppearanceThemePicker=()=>React.createElement("p",null,"Themes");'],
]);
const props={open:true,user:{id:'cozy',email:'cozy@example.invalid'},preferences:{},period:{date:'2026-10-20'},dailyCheckIn:{},displayNameDraft:'Cozy',comfortItemDraft:'',restDatesSet:new Set(),restRangeDraft:{start:'',end:''},restDates:[],restoreFileInputRef:{current:null},online:true,syncStatus:'ready'};
let tree;
act(()=>tree=create(React.createElement(SettingsPanel,props)));
const text=()=>JSON.stringify(tree.toJSON());
// Choose a home row by its title span without depending on decorative copy.
const homeRow=title=>tree.root.findAllByType('button').find(n=>n.findAllByType('span').some(s=>s.children.join('')===title));
assert.equal(tree.root.findAllByType('button').length,4,'Settings starts with four choices');
act(()=>homeRow('Personalize').props.onClick());
assert(text().includes('Larger text'),'Accessibility lives with appearance');
assert(text().includes('Widget controls'));
const nav=()=>tree.root.findByProps({'aria-label':'Settings sections'});
act(()=>nav().findAllByType('button').find(n=>n.children.join('')==='Reminders').props.onClick());
assert(text().includes('Protected rest'),'Rest settings live beside reminders');
assert.equal(tree.root.findAllByProps({'aria-label':'Back to settings'}).length,1,'Related settings do not repeat navigation');
act(()=>nav().findAllByType('button').find(n=>n.children.join('')==='Privacy').props.onClick());
assert(text().includes('Suggestion privacy'));
act(()=>nav().findAllByType('button').find(n=>n.children.join('')==='Account').props.onClick());
assert(text().includes('Help & Feedback'));
act(()=>tree.root.findAllByType('button').find(n=>n.children.join('')==='Delete account').props.onClick());
assert(tree.root.findAllByProps({id:'delete-account-confirmation'}).length);
act(()=>tree.update(React.createElement(SettingsPanel,{...props,user:{id:'other',email:'other@example.invalid'}})));
assert(!tree.root.findAllByProps({id:'delete-account-confirmation'}).length,'Account switching clears destructive confirmation');
assert.equal(tree.root.findAllByType('button').length,4);
act(()=>tree.unmount());
const {ProgressPanel}=load('src/components/progress-panel.jsx',[
 [/import \{ HabitStudio \}[^;]+;/,'const HabitStudio=()=>null;'],
 [/import \{ hasGoldFeature \}[^;]+;/,'const hasGoldFeature=()=>true;'],
 [/const LazyExistingProgressPanel[^;]+;/,'const LazyExistingProgressPanel=({hideNavigation})=>React.createElement("p",null,hideNavigation?"Summary only":"Duplicate navigation");'],
 [/const LazyGoldStoryView[^;]+;/,'const LazyGoldStoryView=({hideNavigation})=>React.createElement("p",null,hideNavigation?"Story only":"Duplicate navigation");'],
 [/const LazyGoldSpacesView[^;]+;/,'const LazyGoldSpacesView=({hideNavigation})=>React.createElement("p",null,hideNavigation?"Areas only":"Duplicate navigation");'],
 [/const LazyGrowthMoments[^;]+;/,'const LazyGrowthMoments=()=>null;'],
]);
let chosen=[],plush=0;
for(const view of ['overview','story','areas']){
 act(()=>tree=create(React.createElement(ProgressPanel,{open:true,progressView:view,setProgressView:id=>chosen.push(id),onOpenPlush:()=>plush++})));
 assert.equal(tree.root.findAllByProps({'aria-label':'Progress sections'}).length,1);
 assert(!text().includes('Duplicate navigation'));
 const buttons=tree.root.findByProps({'aria-label':'Progress sections'}).findAllByType('button');
 assert.equal(buttons.filter(b=>b.props['aria-pressed']).length,1);
 act(()=>buttons[2].props.onClick());
 act(()=>tree.root.findByProps({className:'pl-progress-plush-link'}).props.onClick());
 act(()=>tree.unmount());
}
assert.deepEqual(chosen,['areas','areas','areas']);assert.equal(plush,3);
console.log('Workspace simplicity passed: four settings groups, direct switching, related controls, confirmation reset and consistent Progress navigation.');
