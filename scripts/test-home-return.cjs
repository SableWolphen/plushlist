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
act(()=>tree.unmount());fs.rmSync(dir,{recursive:true,force:true});
console.log('Home return passed: gentle greeting, user-chosen Tiny day, dismissal, and current-day-only display.');
