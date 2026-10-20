const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const React=require('react');
const {create,act}=require('react-test-renderer');
const {buildSync}=require('esbuild');
function load(file,changes=[],scope={}) {
 let source=fs.readFileSync(file,'utf8');for(const [a,b]of changes)source=source.replace(a,b);
 const code=buildSync({stdin:{contents:source,resolveDir:process.cwd()+'/src/components',loader:'jsx'},bundle:true,write:false,format:'cjs',platform:'node'}).outputFiles[0].text;
 const context={module:{exports:{}},React,console,...scope};vm.runInNewContext(code,context);return context.module.exports;
}
const {QuickCapture}=load('src/components/quick-capture.jsx');
const byLabel=(tree,label)=>tree.root.findByProps({'aria-label':label});
const button=(tree,label)=>tree.root.findAllByType('button').find(b=>b.children.join('')===label);
(async()=>{
 for(const habit of [false,true]) {
  let tree,saved=[],more=[];act(()=>{tree=create(React.createElement(QuickCapture,{habit,onQuickAdd:async(...a)=>{saved.push(a);return true;},onMoreOptions:(...a)=>more.push(a)}));});
  const label=habit?'Quickly add a habit':'Quickly add a task';
  assert.equal(tree.root.findAllByType('input').length,1);
  assert.equal(button(tree,'Add').props.disabled,true);
  act(()=>byLabel(tree,label).props.onChange({target:{value:'  Drink water  '}}));
  await act(async()=>button(tree,'Add').props.onClick());
  assert.equal(saved[0][0],'Drink water');assert.equal(saved[0][1],'today');
  assert.equal(saved[0][2].kind,habit?'build':'regular');assert.equal(saved[0][2].repeat,habit?'daily':'once');
  assert.equal(byLabel(tree,label).props.value,'');
  act(()=>byLabel(tree,label).props.onChange({target:{value:'Keep this draft'}}));
  act(()=>byLabel(tree,'Quick add repeat').props.onChange({target:{value:'weekdays'}}));
  if(habit)act(()=>byLabel(tree,'Quick add habit type').props.onChange({target:{value:'reduce'}}));
  assert(!button(tree,'Custom dates, reminders & details'));
  await act(async()=>byLabel(tree,label).props.onKeyDown({key:'Enter',preventDefault(){}}));
  assert.equal(saved[1][2].repeat,'weekdays');if(habit)assert.equal(saved[1][2].kind,'reduce');
  act(()=>tree.unmount());
 }
 let failed;act(()=>{failed=create(React.createElement(QuickCapture,{onQuickAdd:async()=>{throw Error('offline');}}));});
 act(()=>byLabel(failed,'Quickly add a task').props.onChange({target:{value:'Retry me'}}));
 await act(async()=>button(failed,'Add').props.onClick());assert.equal(byLabel(failed,'Quickly add a task').props.value,'Retry me');assert(failed.root.findByProps({role:'alert'}));act(()=>failed.unmount());
 const {quickTaskSchedule}=await import('../src/quick-task-schedule.mjs');
 const source=fs.readFileSync('src/app-source.jsx','utf8');
 const body=source.slice(source.indexOf('const quickAddTrackerTask = async'),source.indexOf('  const [recentlyDeletedTask'));
 async function save(when,options,ownerChanged=false,error=null) {
  let inserted=[],state=[],invalidated=0;
  const context={quickTaskSchedule,user:{id:'cozy'},currentAccountIdRef:{current:ownerChanged?'guardian':'cozy'},trackerTasks:[],setQuickAddMessage(){},dayIdForDate:()=> 'wed',offsetDate:()=> '2026-10-21',period:{date:'2026-10-20'},todayDayId:'tue',SUPPORTER_FEATURES_ENABLED:false,taskSectionsForDay:()=>['Morning'],sectionIsOptional:()=>false,encodeTaskDetail:x=>x,crypto:{randomUUID:()=> 'test'},supabase:{from:()=>({insert:async row=>{inserted.push(row);return {error};}})},warmStartCacheKey:()=> 'cache',window:{localStorage:{removeItem(){invalidated++;}}},setTrackerTasks:update=>{state=update([]);}};
  vm.createContext(context);vm.runInContext(body+';this.save=quickAddTrackerTask;',context);
  const ok=await context.save(' Test name ',when,options);
  return {ok,row:inserted[0],state,invalidated};
 }
 for(const when of ['today','tomorrow','someday']) {
  const result=await save(when);assert(result.ok);assert.equal(result.row.user_id,'cozy');assert.equal(result.row.task,'Test name');
  assert.equal(result.row.schedule_type,when==='someday'?'weekly':'once');assert.equal(result.row.one_time_date,when==='today'?'2026-10-20':when==='tomorrow'?'2026-10-21':null);assert.equal(result.invalidated,1);
 }
 for(const kind of ['build','reduce']) {
  const result=await save('today',{kind,repeat:'weekdays'});assert(result.ok);assert.equal(result.row.day_id,'daily');assert.equal(result.row.detail,kind);assert.equal(result.row.one_time_date,null);assert.equal(result.row.schedule_type,'weekly');assert.equal(result.row.schedule_days.join(','),'mon,tue,wed,thu,fri');assert.equal(result.state[0].task_key,result.row.task_key);
 }
 assert.equal((await save('today',{},true)).state.length,0,'Account switching must not show another account’s save');
 assert.equal((await save('today',{},false,'offline')).ok,false);
 // Android release safety: no legacy plugin and both code/resource optimization.
 const pkg=JSON.parse(fs.readFileSync('package.json'));assert(!pkg.dependencies['@capacitor/status-bar']);
 const config=JSON.parse(fs.readFileSync('capacitor.config.json'));assert.equal(config.plugins.SystemBars.insetsHandling,'css');assert(!config.plugins.Keyboard.resizeOnFullScreen);
 const gradle=fs.readFileSync('android/app/build.gradle','utf8');assert(gradle.includes('minifyEnabled true'));assert(gradle.includes('shrinkResources true'));
 console.log('Short task flow passed: one-field task/habit creation, optional schedules, retry, real save payloads and account-switch guard.');
})().catch(error=>{console.error(error);process.exitCode=1;});
