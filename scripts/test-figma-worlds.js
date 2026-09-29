const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { dayIdForDate } = require('../assets/plush-schedule.js');
const app = fs.readFileSync('src/app-source.jsx', 'utf8');
const manager = app.match(/const openTaskManager = \([^]*?\n  };/)[0];
const changes = {};
const context = {dayIdForDate,period:{date:'2026-09-29'},taskSectionsForDay: day => {changes.sectionDay=day;return ['Little things'];}};
for(const key of ['NewTaskDay','NewTaskSection','NewTaskCustomSection','TaskAdvancedOpen','ManageTasks','Dashboard'])context['set'+key]=value=>changes[key]=value;
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
console.log('Figma worlds regression checks passed: date routing, exact SVG dimensions, and offline assets.');
