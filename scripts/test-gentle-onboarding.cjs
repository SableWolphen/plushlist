const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),vm=require('node:vm');
const React=require('react'),Renderer=require('react-test-renderer'),esbuild=require('esbuild');
global.React=React;
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'gentle-onboarding-'));
esbuild.buildSync({entryPoints:['src/components/gentle-onboarding.jsx'],bundle:true,platform:'node',format:'cjs',outfile:path.join(temp,'panel.cjs')});
const {GentleOnboarding}=require(path.join(temp,'panel.cjs'));
const source=fs.readFileSync('src/app-source.jsx','utf8');
const start=source.indexOf('  const completeOnboarding = async () => {');
const finish=source.indexOf('  const saveNativePushToken',start);
const completeSource=source.slice(start,finish);
function fixture({name='Cozy',mode='cozy',tasks=[],failPreferences=false}={}){
  const state={writes:[],messages:[],steps:[],busy:[],preferences:{notifications_enabled:false},failPreferences};
  const context={user:{id:'test-owner'},displayNameDraft:name,onboardingMode:mode,onboardingReason:null,onboardingStep:1,comfortItemDraft:'',trackerTasks:tasks,preferences:state.preferences,cozyComfort:{status:'error'},onboardingSaving:{current:false},CURRENT_CHANGELOG_VERSION:'test',Date,
    setOnboardingMessage:value=>state.messages.push(value),setOnboardingStep:value=>state.steps.push(value),setOnboardingBusy:value=>state.busy.push(value),setTrackerTasks:value=>context.trackerTasks=value,setPreferences:value=>context.preferences=value,setTrackerProfile:value=>state.profile=value,setSupportViewMode:()=>{},setDashboard:value=>state.dashboard=value,invitedSupportLinks:[],loadSupportOwner:async()=>{},
    supabase:{from(table){let payload;const q={upsert(value){payload=value;return q},insert(value){payload=value;return q},select(){return q},single(){return q},then(resolve,reject){state.writes.push({table,payload});return Promise.resolve({data:payload,error:table==='app_preferences'&&state.failPreferences?new Error('offline'):null}).then(resolve,reject)}};return q;}}};
  vm.createContext(context);vm.runInContext(completeSource+'\nglobalThis.finish=completeOnboarding;',context);
  return {state,context};
}
(async()=>{
  let calls=0,mode;
  let tree;const props={name:'',onName(){},reason:null,onReason(){},mode:'cozy',onMode:value=>mode=value,onFinish:()=>calls++,busy:false};
  await Renderer.act(async()=>{tree=Renderer.create(React.createElement(GentleOnboarding,props));});
  assert.equal(tree.root.findByProps({type:'submit'}).props.disabled,true);
  await Renderer.act(async()=>tree.root.findByType('form').props.onSubmit({preventDefault(){}}));assert.equal(calls,0);
  await Renderer.act(async()=>tree.update(React.createElement(GentleOnboarding,{...props,name:'Sable'})));
  await Renderer.act(async()=>tree.root.findByType('form').props.onSubmit({preventDefault(){}}));assert.equal(calls,1,'optional question can be skipped');
  await Renderer.act(async()=>tree.root.findAllByType('button').find(b=>b.children.join('').includes('Guardian invitations')).props.onClick());assert.equal(mode,'supporter');
  await Renderer.act(async()=>tree.update(React.createElement(GentleOnboarding,{...props,name:'Sable',busy:true})));
  await Renderer.act(async()=>tree.root.findByType('form').props.onSubmit({preventDefault(){}}));assert.equal(calls,1,'busy prevents duplicate submissions');
  await Renderer.act(async()=>tree.unmount());
  const empty=fixture({name:'  '});await empty.context.finish();assert.equal(empty.state.writes.length,0);
  const fresh=fixture();await fresh.context.finish();assert.equal(fresh.state.steps.at(-1),0);assert.equal(fresh.context.trackerTasks.length,1);assert.equal(fresh.context.trackerTasks[0].task,'Drink water');assert.equal(fresh.context.preferences.notifications_enabled,false);assert.ok(!fresh.state.writes.some(x=>x.table==='cozy_profiles'),'comfort service cannot block onboarding');
  const retry=fixture({failPreferences:true});await retry.context.finish();assert.ok(!retry.state.steps.includes(0),'save failure keeps welcome open');assert.equal(retry.state.busy.at(-1),false);retry.state.failPreferences=false;await retry.context.finish();assert.equal(retry.state.writes.filter(x=>x.table==='tracker_tasks').length,1,'retry keeps the saved starter task');assert.equal(retry.state.steps.at(-1),0);
  const existing=fixture({tasks:[{task_key:'saved',task:'My existing habit'}]});await existing.context.finish();assert.equal(existing.context.trackerTasks[0].task_key,'saved');assert.ok(!existing.state.writes.some(x=>x.table==='tracker_tasks'));
  const guardian=fixture({mode:'supporter'});await guardian.context.finish();assert.equal(guardian.state.dashboard,'guardian');assert.equal(guardian.state.profile.account_type,'caretaker');assert.ok(!guardian.state.writes.some(x=>x.table==='tracker_tasks'));
  console.log('Gentle onboarding passed: optional choices, save failure/retry, existing tasks, comfort-service independence and Guardian routing.');
})().catch(error=>{console.error(error);process.exitCode=1}).finally(()=>fs.rmSync(temp,{recursive:true,force:true}));
