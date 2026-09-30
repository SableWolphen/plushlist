import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { build } from 'esbuild';
import React from 'react';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const content = require('../assets/plush-content.js');
const themeCopy = require('../assets/plush-theme-copy.js');
const wardrobe = await import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync('src/mascot-wardrobe.js','utf8')).toString('base64'));
const sprite = fs.readFileSync('assets/plush-outfits.svg','utf8');
const symbols = new Set([...sprite.matchAll(/<symbol id="([^"]+)"/g)].map(match => match[1]));
for (const outfit of content.MASCOT_OUTFITS.filter(item => item.id !== 'classic')) {
  assert.ok(wardrobe.OUTFIT_KINDS[outfit.id],`Missing fitted outfit: ${outfit.id}`);
  assert.ok(wardrobe.FRONT_OUTFITS.has(outfit.id)||wardrobe.REAR_OUTFITS.has(outfit.id));
  for (const [set,layer] of [[wardrobe.FRONT_OUTFITS,'front'],[wardrobe.REAR_OUTFITS,'back']]) {
    if(set.has(outfit.id)) assert.ok(symbols.has(`${outfit.id}-${layer}`),`Missing outfit artwork: ${outfit.id}-${layer}`);
  }
}
assert.ok(fs.readFileSync('service-worker.js','utf8').includes('./assets/plush-outfits.svg'),'Fitted outfits must work offline');
const globals={React:{...React,useState:initial=>[initial,()=>{}],useContext:()=>({world:'baby-night',voice:'fatherly'})},window:{PlushLifeContent:content,PlushLifeThemeCopy:themeCopy},console};
async function moduleAt(entry){const bundle=await build({entryPoints:[entry],bundle:true,write:false,format:'cjs',loader:{'.jsx':'jsx'}});const context={...globals,module:{exports:{}},exports:{}};vm.runInNewContext(bundle.outputFiles[0].text,context);return context.module.exports;}
function flatten(node){if(!node||typeof node!=='object')return [];return [node,...[node.props?.children].flat(Infinity).flatMap(flatten)];}
const {ThemeScene}=await moduleAt('src/components/theme-world.jsx');
for (const world of Object.keys(themeCopy.worlds)) {
  for (const outfit of content.MASCOT_OUTFITS) {
    const nodes=flatten(ThemeScene({world,outfit}));
    const image=nodes.find(n=>n.type==='img');
    assert.ok(image.props.alt.includes(outfit.name));
    for(const layer of nodes.filter(n=>n.type==='svg')){
      assert.equal(layer.props.width,image.props.width,'Outfit and bear share one artwork coordinate system');
      assert.equal(layer.props.height,image.props.height);
      assert.equal(layer.props.viewBox,`0 0 ${image.props.width} 100`);
    }
    assert.equal(nodes.filter(n=>n.type==='img').length,1,'One mascot per scene');
  }
}
const {RewardsPanel}=await moduleAt('src/components/rewards-panel.jsx');
const selected=content.MASCOT_OUTFITS.find(x=>x.id==='backpack');
const earned=content.MASCOT_OUTFITS.slice(0,17);
let saved;
const props={open:true,inline:true,selectedOutfit:selected,activityDaysTotal:53,unlockedOutfits:earned,earnedBadgeIdSet:new Set(),BADGE_DEFS:[],unlockedIdSet:new Set(earned.map(x=>x.id)),mascotRequirementProgress:()=>5,saveMascotCollection:value=>saved=value,mascotCollection:{selectedId:'backpack',celebrationSound:true,unlockedIds:earned.map(x=>x.id)},savedBestStreak:9,collectionTab:'mascot',setCollectionTab:()=>{},winsJarEntries:[],theme:'baby-night'};
let nodes=flatten(RewardsPanel(props));
const cards=nodes.filter(n=>n.type==='button'&&n.props.className==='pl-collection-item'&&!n.props.disabled);
assert.equal(cards.length,6,'Default closet shows six outfits');
assert.equal(cards[0].props['aria-pressed'],true,'Wearing outfit stays visible in the short list');
const other=cards.find(n=>n.props['aria-pressed']===false);other.props.onClick();
assert.ok(props.unlockedIdSet.has(saved.selectedId));assert.equal(saved.celebrationSound,true);assert.equal(saved.unlockedIds.length,17);assert.equal(saved.bestStreak,9);
for(const card of nodes.filter(n=>n.type==='button'&&n.props.disabled)){saved=undefined;card.props.onClick();assert.equal(saved,undefined,'Locked outfits cannot be equipped');}
assert.ok(nodes.filter(n=>n.type==='details').every(n=>!n.props.open),'Long reward lists start collapsed');
for(const path of ['src/app-source.jsx','src/components/care-panel.jsx','src/components/care-panel-existing.jsx','src/components/baby-mode.jsx'])assert.ok(!fs.readFileSync(path,'utf8').includes('MamasCorner'),`Private corner removed from ${path}`);
assert.ok(fs.readFileSync('src/app-source.jsx','utf8').includes('const babyCaregiverName = preferences.baby_voice === "fatherly" ? "Daddy" : "Mommy";'),'Nursery voices remain selectable');
console.log('Wardrobe checks passed: every earned outfit, shared bear coordinates in every theme, offline artwork, safe equip, compact collections, and removed private corner.');
