const assert=require('node:assert/strict'),fs=require('fs'),os=require('os'),path=require('path');
const React=require('react'),Renderer=require('react-test-renderer');global.React=React;
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'reward-moment-'));
require('esbuild').buildSync({entryPoints:['src/components/reward-moment.jsx'],bundle:true,platform:'node',format:'cjs',outfile:path.join(dir,'reward.cjs')});
const {RewardMoment}=require(path.join(dir,'reward.cjs'));
const outfit=require('../assets/plush-content.js').MASCOT_OUTFITS.find(o=>o.id==='bow');
assert.deepEqual(outfit.unlock,{type:'first_step',count:1});
const vm=require('vm'),source=fs.readFileSync('src/app-source.jsx','utf8');
const requirement=source.match(/const mascotRequirementProgress = \(outfit\) => \{[\s\S]*?\n  \};/)[0];
for(const [habitHistory,done,expected] of [[[],{},0],[[],{water:true},1],[[{completed_keys:['water']}],{},1],[[{completed_keys:[]}],{},0]]){
  const context={habitHistory,done};vm.runInNewContext(requirement+';result=mascotRequirementProgress({unlock:{type:"first_step"}})',context);assert.equal(context.result,expected);
}
let equipped=null,later=0;
const tree=Renderer.create(React.createElement(RewardMoment,{outfit,onWear:o=>equipped=o,onDismiss:()=>later++}));
assert.match(JSON.stringify(tree.toJSON()),/first completed step/);
assert.equal(tree.root.findByProps({role:'status'}).props['aria-live'],'polite');
const buttons=tree.root.findAllByType('button');buttons[0].props.onClick();assert.equal(equipped,outfit);buttons[1].props.onClick();assert.equal(later,1);
tree.update(React.createElement(RewardMoment,{outfit:null}));assert.equal(tree.toJSON(),null);tree.unmount();
fs.rmSync(dir,{recursive:true,force:true});console.log('Reward moment passed: first-step reward, wearable selection, optional dismissal, and announcement.');
