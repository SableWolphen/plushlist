const assert=require('node:assert/strict');
const React=require(process.cwd()+'/node_modules/react');
const TestRenderer=require(process.cwd()+'/node_modules/react-test-renderer');
global.React=React;
const esbuild=require(process.cwd()+'/node_modules/esbuild');
const os=require('node:os');
const path=require('node:path');
const fs=require('node:fs');
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'plush-together-test-'));
const compiled=path.join(temp,'together.cjs');
esbuild.buildSync({entryPoints:['src/components/together-corner.jsx'],bundle:true,platform:'node',format:'cjs',outfile:compiled});
const {TogetherCorner,parseTogetherNote}=require(compiled);
const {act}=TestRenderer;

const parsed=parseTogetherNote({body:'[Together:activity] Take a little walk'});
assert.equal(parsed.type.id,'activity');
assert.equal(parsed.text,'Take a little walk');
assert.equal(parseTogetherNote({body:'regular note'}),null);

const writes=[];
const client={from(table){return {insert(payload){writes.push({table,payload});return Promise.resolve({error:null});}};}};
const base={
  client,
  user:{id:'cozy-id'},
  supportOwnerId:'cozy-id',
  isSupportAdult:false,
  canSendSupportNotes:false,
  ownedSupportLinks:[{active:true,accepted_at:'yes'}],
  selectedSupportName:'Sam',
  supportNotes:[],
  loadSupportData:async()=>{},
  loadSupportOwner:async()=>{},
};
(async()=>{
  let tree;
  await act(async()=>{tree=TestRenderer.create(React.createElement(TogetherCorner,base));});
  const add=tree.root.findAllByType('button').find(b=>b.children.join('')==='+ Add');
  assert.ok(add,'Cozy gets one simple add button');
  await act(async()=>{add.props.onClick();});
  const textarea=tree.root.findByType('textarea');
  await act(async()=>{textarea.props.onChange({target:{value:'Movie night at 8'}});});
  const save=tree.root.findAllByType('button').find(b=>b.children.join('')==='Add to corner');
  await act(async()=>{await save.props.onClick();});
  assert.equal(writes.at(-1).table,'support_notes');
  assert.equal(writes.at(-1).payload.owner_user_id,'cozy-id');
  assert.equal(writes.at(-1).payload.caregiver_user_id,'cozy-id');
  assert.match(writes.at(-1).payload.body,/^\[Together:activity\] Movie night at 8$/);

  const guardianProps={...base,user:{id:'guardian-id'},supportOwnerId:'cozy-id',isSupportAdult:true,canSendSupportNotes:true,ownedSupportLinks:[],selectedSupportName:'Sam'};
  await act(async()=>{tree.update(React.createElement(TogetherCorner,guardianProps));});
  assert.ok(tree.root.findAllByType('button').some(b=>b.children.join('')==='+ Add'),'Guardian with note permission can add');

  const quietGuardian={...guardianProps,canSendSupportNotes:false};
  await act(async()=>{tree.update(React.createElement(TogetherCorner,quietGuardian));});
  assert.equal(tree.root.findAllByType('button').some(b=>b.children.join('')==='+ Add'),false,'Guardian without permission cannot write');

  await act(async()=>{tree.unmount();});
  console.log('Together Corner checks passed: shared parsing, Cozy writing, Guardian writing, and permission gating.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>fs.rmSync(temp,{recursive:true,force:true}));
