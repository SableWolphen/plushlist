const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { dayIdForDate } = require('../assets/plush-schedule.js');
const app = fs.readFileSync('src/app-source.jsx', 'utf8');
const manager = app.match(/const openTaskManager = \([^]*?\n  };/)[0];
const changes = {};
const context = {dayIdForDate,period:{date:'2026-09-29'},taskSectionsForDay: day => {changes.sectionDay=day;return ['Little things'];}};
for(const key of ['NewTaskDay','NewTaskSection','NewTaskCustomSection','TaskAdvancedOpen','ManageTasks','Dashboard','TaskManagerView','TaskManagerRequest','TaskSearchQuery','SelectedProgressDate','Active'])context['set'+key]=value=>changes[key]=value;
vm.runInNewContext('{'+manager+'\nopenTaskManager("2026-09-29");}',context);
assert.equal(changes.NewTaskDay,'tue');
assert.equal(changes.sectionDay,'tue');
assert.equal(changes.Dashboard,'tasks');
assert.equal(changes.ManageTasks,false);
vm.runInNewContext('{'+manager+'\nopenTaskManager();}',context);
assert.equal(changes.NewTaskDay,'tue');
vm.runInNewContext('{'+manager+'\nopenTaskManager("daily");}',context);
assert.equal(changes.NewTaskDay,'daily');
const worker = fs.readFileSync('service-worker.js','utf8');
for(const directory of ['figma','fonts'])for(const name of fs.readdirSync('assets/'+directory)){
  if(name.endsWith('.txt'))continue;
  const path='assets/'+directory+'/'+name;
  assert.ok(worker.includes('./'+path),path+' must be available offline');
  const buffer=fs.readFileSync(path);
  if(name.endsWith('.svg')){assert.match(buffer.toString(),/<svg\b/);assert.doesNotMatch(buffer.toString(),/<html/i);}
  else assert.ok(buffer.length>10000,'font should contain real font data');
}
for(const theme of ['soft','dino','baby','pink','meadow','peach','twilight','strawberry','soft-light','baby-night'])assert.match(fs.readFileSync('assets/figma/'+theme+'.svg','utf8'),/<svg[^>]*width="211"[^>]*height="100"/);
vm.runInNewContext('{'+manager+'\nopenTaskManager("2026-09-29", "habits");}',context);
assert.equal(changes.TaskManagerView,'habits');
assert.equal(changes.TaskSearchQuery,'');
const { worlds } = require('../assets/plush-theme-copy.js');
function luminance(hex) {
  const [r, g, b] = hex.match(/[a-f\d]{2}/gi).map(value => parseInt(value, 16) / 255)
    .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);
  return r * 0.2126 + g * 0.7152 + b * 0.0722;
}
function contrast(a, b) {
  const values = [luminance(a), luminance(b)];
  return (Math.max(...values) + 0.05) / (Math.min(...values) + 0.05);
}
for (const [world, palette] of Object.entries(worlds)) {
  for (const background of ['background', 'surface', 'surface2']) {
    for (const text of ['ink', 'muted']) {
      assert.ok(contrast(palette[text], palette[background]) >= 4.5, `${world}: ${text} must be readable on ${background}`);
    }
  }
  const buttonText = ['twilight', 'baby-night'].includes(world) ? '#29223E' : '#FFFFFF';
  assert.ok(contrast(buttonText, palette.accent) >= 4.5, `${world}: primary button text must be readable`);
}
console.log('Figma worlds regression checks passed: date routing, offline assets, and readable theme contrast.');
