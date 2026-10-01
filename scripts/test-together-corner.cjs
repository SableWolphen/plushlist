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
const {TogetherCorner,parseTogetherNote,occurrenceKeyFor}=require(compiled);
const {act}=TestRenderer;

const parsed=parseTogetherNote({body:'[Together:activity] Take a little walk'});
assert.equal(parsed.type.id,'activity');
assert.equal(parsed.text,'Take a little walk');
assert.equal(parseTogetherNote({body:'regular note'}),null);
assert.equal(occurrenceKeyFor({recurrence:'weekly'},new Date('2026-10-01T12:00:00')), '2026-09-28');

const writes=[];
const rpcCalls=[];
const rows={together_items:[],together_item_participation:[]};
const client={
  from(table){
    let mode='read',payload=null;
    const q={
      select(){return q},
      eq(){return q},
      order(){return q},
      limit(){return q},
      in(){return q},
      delete(){mode='delete';return q},
      insert(value){mode='insert';payload=value;writes.push({table,payload:value});return Promise.resolve({data:value,error:null})},
      then(resolve,reject){
        const result={data:mode==='read'?(rows[table]||[]):[],error:null};
        return Promise.resolve(result).then(resolve,reject);
      }
    };
    return q;
  },
  rpc(name,args){rpcCalls.push({name,args});return Promise.resolve({data:{},error:null});}
};
const cozyLink={id:'link-1',active:true,accepted_at:'yes',can_use_together:true,label:'Guardian'};
const base={
  client,
  user:{id:'cozy-id'},
  supportOwnerId:'cozy-id',
  isSupportAdult:false,
  activeSupportLink:null,
  ownedSupportLinks:[cozyLink],
  selectedSupportName:'Sam',
};
(async()=>{
  let tree;
  await act(async()=>{tree=TestRenderer.create(React.createElement(TogetherCorner,base));await new Promise(r=>setImmediate(r));});
  const add=tree.root.findAllByType('button').find(b=>b.children.join('')==='+ Add');
  assert.ok(add,'Cozy gets one simple add button');
  await act(async()=>{add.props.onClick();});
  const textarea=tree.root.findByType('textarea');
  await act(async()=>{textarea.props.onChange({target:{value:'Movie night at 8'}});});
  const save=tree.root.findAllByType('button').find(b=>b.children.join('')==='Add to corner');
  await act(async()=>{await save.props.onClick();});
  assert.equal(writes.at(-1).table,'together_items');
  assert.equal(writes.at(-1).payload.owner_user_id,'cozy-id');
  assert.equal(writes.at(-1).payload.caregiver_link_id,'link-1');
  assert.equal(writes.at(-1).payload.created_by_role,'cozy');
  assert.equal(writes.at(-1).payload.body,'Movie night at 8');

  const guardianLink={id:'link-1',active:true,accepted_at:'yes',can_use_together:true,owner_user_id:'cozy-id'};
  const guardianProps={...base,user:{id:'guardian-id'},supportOwnerId:'cozy-id',isSupportAdult:true,activeSupportLink:guardianLink,ownedSupportLinks:[],selectedSupportName:'Sam'};
  await act(async()=>{tree.update(React.createElement(TogetherCorner,guardianProps));await new Promise(r=>setImmediate(r));});
  assert.ok(tree.root.findAllByType('button').some(b=>b.children.join('')==='+ Add'),'Guardian with Together permission can add');

  const blockedGuardian={...guardianProps,activeSupportLink:{...guardianLink,can_use_together:false}};
  await act(async()=>{tree.update(React.createElement(TogetherCorner,blockedGuardian));await new Promise(r=>setImmediate(r));});
  assert.equal(tree.root.findAllByType('button').some(b=>b.children.join('')==='+ Add'),false,'Guardian without Together permission cannot write');
  assert.ok(tree.root.findAll(node=>node.type==='div' && node.children.join('').includes('hasn’t turned on Together sharing')).length>0);

  await act(async()=>{tree.unmount();});
  console.log('Together Corner checks passed: Cozy writing, Guardian writing, relationship permission gating, and occurrence keys.');
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>fs.rmSync(temp,{recursive:true,force:true}));
