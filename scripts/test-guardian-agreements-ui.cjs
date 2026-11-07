const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const React = require("react");
const {act,create} = require("react-test-renderer");
global.React = React;
const temp = fs.mkdtempSync(path.join(os.tmpdir(),"guardian-agreements-"));
require("esbuild").buildSync({entryPoints:["src/components/guardian-agreements.jsx"],bundle:true,platform:"node",format:"cjs",outfile:path.join(temp,"ui.cjs")});
const {GuardianAgreements,AgreementWorkspace} = require(path.join(temp,"ui.cjs"));
const link = {id:"relationship-a",label:"Person A",active:true,accepted_at:"yes"};
const second = {...link,id:"relationship-b",label:"Person B"};
const user = {id:"owner"};
const calls=[];
let rows=[];
let fail=false;
const client={
  from(table){
    const q={select(){return q},eq(){return q},in(){return q},order(){return q},limit(){return q},then(resolve,reject){calls.push({read:table});return Promise.resolve({data:table==="guardian_agreements"?rows:[],error:fail?Error("offline"):null}).then(resolve,reject)}};
    return q;
  },
  async rpc(name,args){calls.push({name,args});return {data:{},error:fail?Error("offline"):null};}
};
const flush=()=>new Promise(r=>setImmediate(r));
const text=tree=>JSON.stringify(tree.toJSON());
const button=(tree,label)=>tree.root.findAllByType("button").find(b=>b.children.join("")===label);
(async()=>{
  let tree;
  await act(async()=>{tree=create(React.createElement(GuardianAgreements,{client,user,links:[link,second],ready:true}));await flush()});
  assert.equal(calls.length,0,"optional tool does not read before opening");
  await act(async()=>{tree.root.findByType("details").props.onToggle({currentTarget:{open:true}});await flush()});
  assert.equal(tree.root.findByProps({"aria-label":"Agreement mode"}).props.value,"supportive");
  const propose=()=>button(tree,"Propose for mutual acceptance");
  assert.equal(propose().props.disabled,true);
  for (const [label,value] of [["Expectations","One small thing"],["Boundaries","We can stop anytime"]]) {
    await act(async()=>tree.root.findByProps({"aria-label":label}).props.onChange({target:{value}}));
  }
  await act(async()=>tree.root.findByType("input").props.onChange({target:{checked:true}}));
  assert.equal(propose().props.disabled,false);
  await act(async()=>tree.root.findByProps({"aria-label":"Expectations"}).props.onChange({target:{value:"Revised terms"}}));
  assert.equal(propose().props.disabled,true,"editing terms invalidates proposal checkbox");
  await act(async()=>tree.root.findByType("input").props.onChange({target:{checked:true}}));
  await act(async()=>{await propose().props.onClick();await flush()});
  assert.equal(calls.find(c=>c.name)?.args.p_terms.mode,"supportive");
  assert.equal(calls.find(c=>c.name)?.args.p_link_id,link.id);
  await act(async()=>{tree.root.findByProps({"aria-label":"Agreement relationship"}).props.onChange({target:{value:second.id}});await flush()});
  assert.equal(tree.root.findByProps({"aria-label":"Expectations"}).props.value,"");
  assert.equal(tree.root.findByType("input").props.checked,false);
  rows=[{id:"agreement",owner_user_id:"owner",guardian_user_id:"guardian",proposed_by:"owner",mode:"accountability",status:"proposed",expectations:"Exact terms",boundaries:"Stop anytime"}];
  await act(async()=>{tree.update(React.createElement(AgreementWorkspace,{key:"pending-owner",client,user,link}));await flush()});
  assert.ok(!button(tree,"I agree to these terms"),"proposer cannot self accept");
  assert.ok(text(tree).includes("Supportive Guardian"));
  await act(async()=>{tree.update(React.createElement(AgreementWorkspace,{key:"pending-guardian",client,user:{id:"guardian"},link}));await flush()});
  assert.ok(button(tree,"I agree to these terms"));
  rows=[{...rows[0],status:"accepted"}];
  await act(async()=>{tree.update(React.createElement(AgreementWorkspace,{key:"accepted",client,user,link}));await flush()});
  assert.ok(text(tree).includes("Accountability · mutually accepted"));
  assert.ok(button(tree,"Behavior") && button(tree,"Reference") && button(tree,"Moods") && button(tree,"Tasks"));
  await act(async()=>button(tree,"Behavior").props.onClick());
  assert.ok(text(tree).includes("not available yet"));
  await act(async()=>button(tree,"Reference").props.onClick());
  assert.ok(text(tree).includes("revision history are not available"));
  await act(async()=>button(tree,"Tasks").props.onClick());
  assert.equal(tree.root.findByProps({"aria-label":"Shared task view"}).props.value,"active");
  await act(async()=>button(tree,"Moods").props.onClick());
  assert.equal(tree.root.findByProps({"aria-label":"Mood prompt"}).props.value,"");
  assert.equal(tree.root.findAllByType("input").find(i=>i.props.type==="checkbox").props.checked,false,"new check-in starts private");
  await act(async()=>tree.root.findByProps({"aria-label":"Agreement mood check-in"}).props.onChange({target:{value:"Private feeling"}}));
  await act(async()=>{await button(tree,"Save private entry").props.onClick();await flush()});
  assert.equal(calls.filter(c=>c.name==="guardian_agreement_mood_action").at(-1).args.p_shared,false);
  fail=true;
  await act(async()=>{await button(tree,"Refresh agreements").props.onClick();await flush()});
  assert.ok(text(tree).includes("Agreements are unavailable"));
  assert.equal(button(tree,"Suggest task"),undefined,"read failure removes consent-dependent controls");
  // A slow response from an old account must not populate the new account's view.
  let resolveOld;
  const slow={from(){const q={select(){return q},eq(){return q},order(){return q},limit(){return q},then(resolve){return new Promise(r=>{resolveOld=r}).then(resolve)}};return q;}};
  await act(async()=>{tree.update(React.createElement(AgreementWorkspace,{key:"old-account",client:slow,user,link}));await flush()});
  fail=false;rows=[];
  await act(async()=>{tree.update(React.createElement(AgreementWorkspace,{key:"new-account",client,user:{id:"someone-else"},link:second}));await flush()});
  await act(async()=>{resolveOld({data:[],error:null});await flush()});
  assert.ok(!text(tree).includes("Private feeling"));
  assert.ok(button(tree,"Propose for mutual acceptance"));
  assert.ok(calls.filter(c=>c.name).every(c=>c.name.startsWith("guardian_agreement")),"no existing permission, task or mood API is written");
  await act(async()=>tree.unmount());
  console.log("Guardian Agreements UI: explicit consent, supportive default, private moods, independent relationships, unavailable backend and account switching passed.");
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>fs.rmSync(temp,{recursive:true,force:true}));
