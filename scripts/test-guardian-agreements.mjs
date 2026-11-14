import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { loadGuardianWorkspace } from "../src/guardian-agreements.mjs";

// Real PostgreSQL semantics in a disposable local WASM database. Never connects
// to the configured Supabase project, its users or its data.
const connectionString = process.env.GUARDIAN_TEST_DATABASE_URL;
let nativeClient;
if (connectionString) {
  const url = new URL(connectionString);
  if (!["localhost","127.0.0.1","[::1]"].includes(url.hostname) || url.pathname !== "/guardian_agreements_test") {
    throw new Error("Only a disposable loopback guardian_agreements_test database is allowed");
  }
  const {Client} = await import("pg");
  nativeClient = new Client({connectionString});
  await nativeClient.connect();
}
const db = nativeClient ? {query:(...args)=>nativeClient.query(...args),exec:sql=>nativeClient.query(sql),close:()=>nativeClient.end()} : new PGlite();
const id = n => `00000000-0000-4000-8000-${String(n).padStart(12,"0")}`;
const [owner, guardian, other, stranger] = [1,2,3,4].map(id);
const [link, secondLink, pendingLink] = [11,12,13].map(id);
const query = (sql, args=[]) => db.query(sql,args);
const as = async uid => {
  await db.exec("reset role");
  await query("select set_config('request.jwt.claim.sub',$1,false)",[uid || ""]);
  await db.exec(`set role ${uid ? "authenticated" : "anon"}`);
};
const denied = async (sql,args=[]) => assert.rejects(query(sql,args));
const action = async (name,args) => (await query(`select * from public.${name}(${args.map((_,i)=>`$${i+1}`).join(",")})`,args)).rows[0];
const terms = { expectations:"Try one small task", boundaries:"Either person may stop anytime", mode:"accountability", rewards:"Choose a film together", consequences:"Discuss a smaller next step, only if still wanted" };
const propose = async (which=link, t=terms) => action("guardian_agreement_action",["propose",null,which,JSON.stringify(t)]);
const accept = agreement => action("guardian_agreement_action",["accept",agreement]);
const revoke = agreement => action("guardian_agreement_action",["revoke",agreement]);
const task = (agreement,operation,taskId=null,body=null,assignee=null) => action("guardian_agreement_task_action",[agreement,operation,taskId,body,assignee]);
const mood = (agreement,operation,moodId=null,body=null,shared=false) => action("guardian_agreement_mood_action",[agreement,operation,moodId,body,shared]);
let checks = 0;
const check = (actual,expected) => { assert.deepEqual(actual,expected); checks++; };
try {
  await db.exec(`create role anon; create role authenticated; create schema auth;
    create table auth.users(id uuid primary key,email text unique);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    grant usage on schema auth to authenticated,anon;
    grant execute on function auth.uid() to authenticated,anon;
    create table public.caregiver_links(id uuid primary key,owner_user_id uuid not null references auth.users(id),caregiver_email text not null,active boolean not null default true,accepted_at timestamptz);
  `);
  for (const [uid,email] of [[owner,"owner@test.invalid"],[guardian,"guardian@test.invalid"],[other,"other@test.invalid"],[stranger,"stranger@test.invalid"]]) {
    await query("insert into auth.users values($1,$2)",[uid,email]);
  }
  await query("insert into caregiver_links values($1,$2,'guardian@test.invalid',true,now()),($3,$2,'other@test.invalid',true,now()),($4,$2,'stranger@test.invalid',true,null)",[link,owner,secondLink,pendingLink]);
  const migration = fs.readdirSync("supabase/migrations").find(file=>file.endsWith("_guardian_agreements.sql"));
  await db.exec(fs.readFileSync(`supabase/migrations/${migration}`,"utf8"));
  for (const name of ["20261107190000_guardian_mood_edit.sql","20261107191000_guardian_behavior_notebooks.sql","20261107192000_guardian_task_recurrence.sql"]) await db.exec(fs.readFileSync(`supabase/migrations/${name}`,"utf8"));
  await as(null);
  await denied("select * from public.guardian_agreements");
  await assert.rejects(propose());
  await as(stranger);
  await assert.rejects(propose());
  await assert.rejects(propose(pendingLink));
  await as(owner);
  await assert.rejects(propose(link,{...terms,boundaries:" "}));
  await assert.rejects(propose(link,{...terms,mode:"supportive"}));
  let a = await propose();
  check(a.status,"proposed");
  await assert.rejects(accept(a.id));
  await assert.rejects(task(a.id,"propose",null,"One thing",owner));
  await assert.rejects(mood(a.id,"create",null,"Private"));
  await assert.rejects(propose());
  for (const table of ["guardian_agreements","guardian_agreement_tasks","guardian_agreement_moods"]) {
    await denied(`delete from public.${table}`);
    await denied(`update public.${table} set id=id`);
    await denied(`insert into public.${table}(id) values($1)`,[id(999)]);
  }
  await as(guardian);
  a = await accept(a.id);
  check(a.accepted_by,guardian);
  check(a.status,"accepted");
  await assert.rejects(accept(a.id));
  const behavior=await action("guardian_behavior_action",[a.id,"log",null,"Completed a gentle routine",null,""]);
  const eventId=behavior.guardian_behavior_action;
  await action("guardian_behavior_action",[a.id,"score",eventId,null,2,"Encouraging"]);
  check((await query("select score from guardian_behavior_reviews where event_id=$1",[eventId])).rows,[{score:2}]);
  const note=await action("guardian_notebook_action",[a.id,"create",null,"Shared ideas","First draft",null]);
  const noteId=note.guardian_notebook_action;
  await action("guardian_notebook_action",[a.id,"edit",noteId,null,"Second draft",1]);
  await assert.rejects(action("guardian_notebook_action",[a.id,"edit",noteId,null,"Stale overwrite",1]));
  check((await query("select version from guardian_shared_notebooks where id=$1",[noteId])).rows,[{version:2}]);
  // Run the workspace loader's actual filters/orderings against the disposable
  // schema so nonexistent columns cannot be hidden by permissive UI mocks.
  const workspaceClient={from(table){
    assert.ok(["guardian_behavior_events","guardian_shared_notebooks","guardian_behavior_reviews"].includes(table));
    let column,value,many=false,sort,descending,limit;
    const chain={select(){return chain;},eq(c,v){column=c;value=v;return chain;},in(c,v){column=c;value=v;many=true;return chain;},order(c,options){sort=c;descending=options.ascending===false;return chain;},limit(n){limit=n;return chain;},then(resolve,reject){
      for(const identifier of [column,sort])assert.match(identifier,/^[a-z_]+$/);
      return query(`select * from public.${table} where ${column} ${many?'= any($1::uuid[])':'= $1'} order by ${sort} ${descending?'desc':'asc'} limit $2`,[value,limit]).then(result=>({data:result.rows,error:null})).then(resolve,reject);
    }};return chain;
  }};
  const workspace=await loadGuardianWorkspace(workspaceClient,a.id);
  check(workspace.notebooks.map(n=>n.id),[noteId]);
  check(workspace.events.map(e=>e.id),[eventId]);
  await as(owner);
  await assert.rejects(action("guardian_behavior_action",[a.id,"score",eventId,null,4,"Unauthorized"]));
  await action("guardian_notebook_action",[a.id,"edit",noteId,null,"Owner revision",2]);
  check((await query("select version from guardian_notebook_revisions where notebook_id=$1 order by version",[noteId])).rows,[{version:1},{version:2},{version:3}]);
  await as(guardian);
  const t = await task(a.id,"propose",null,"Drink water if wanted",owner);
  await assert.rejects(task(a.id,"accept",t.id));
  await assert.rejects(task(a.id,"complete",t.id));
  await assert.rejects(task(a.id,"propose",null,"Wrong relationship",other));
  await as(owner);
  await assert.rejects(task(a.id,"complete",t.id));
  check((await task(a.id,"accept",t.id)).status,"accepted");
  const {due,next_due}= (await query("select current_date::text as due,(current_date+7)::text as next_due")).rows[0];
  await action("guardian_task_schedule",[a.id,t.id,due,"weekly"]);
  check((await query("select recurrence from guardian_agreement_tasks where id=$1",[t.id])).rows,[{recurrence:"weekly"}]);
  check((await task(a.id,"complete",t.id)).status,"completed");
  check((await query("select due_on::text as due_on from guardian_agreement_tasks where recurrence_origin=$1",[t.id])).rows,[{due_on:next_due}]);
  await assert.rejects(task(a.id,"accept",t.id));
  const declined = await task(a.id,"propose",null,"Optional",guardian);
  const m = await mood(a.id,"create",null,"Feeling quiet today");
  check(m.shared,false);
  await mood(a.id,"edit",m.id,"Feeling calmer");
  check((await query("select body from guardian_agreement_moods where id=$1",[m.id])).rows,[{body:"Feeling calmer"}]);
  await as(guardian);
  check((await query("select id from guardian_agreement_moods")).rows,[]);
  await assert.rejects(mood(a.id,"share",m.id));
  check((await task(a.id,"decline",declined.id)).status,"declined");
  await as(owner);
  await mood(a.id,"share",m.id);
  await as(guardian);
  check((await query("select body from guardian_agreement_moods")).rows,[{body:"Feeling calmer"}]);
  await as(other);
  for(const table of ["guardian_behavior_events","guardian_behavior_reviews","guardian_shared_notebooks","guardian_notebook_revisions"]){
    check((await query(`select * from public.${table}`)).rows,[]);
    await denied(`delete from public.${table}`);
    await denied(`update public.${table} set ${table==='guardian_notebook_revisions'?'version=version':'id=id'}`);
  }
  await assert.rejects(action("guardian_behavior_action",[a.id,"log",null,"Wrong person",null,""]));
  await assert.rejects(action("guardian_notebook_action",[a.id,"edit",noteId,null,"Wrong person",3]));
  await assert.rejects(action("guardian_task_schedule",[a.id,t.id,due,"daily"]));
  check((await query("select id from guardian_agreements")).rows,[]);
  check((await query("select id from guardian_agreement_tasks")).rows,[]);
  check((await query("select id from guardian_agreement_moods")).rows,[]);
  await assert.rejects(accept(a.id));
  await assert.rejects(revoke(a.id));
  await assert.rejects(task(a.id,"complete",t.id));
  await as(owner);
  const b = await propose(secondLink,{...terms,mode:undefined,consequences:""});
  check(b.mode,"supportive");
  await as(other);
  await accept(b.id);
  // A participant in a different relationship cannot reach this one's child IDs.
  await assert.rejects(task(b.id,"complete",t.id));
  await assert.rejects(mood(b.id,"share",m.id));
  await as(guardian);
  await revoke(a.id);
  for(const table of ["guardian_behavior_events","guardian_behavior_reviews","guardian_shared_notebooks","guardian_notebook_revisions"])check((await query(`select * from public.${table}`)).rows,[]);
  await assert.rejects(action("guardian_behavior_action",[a.id,"score",eventId,null,1,""]));
  await assert.rejects(action("guardian_notebook_action",[a.id,"edit",noteId,null,"After withdrawal",3]));
  await assert.rejects(action("guardian_task_schedule",[a.id,t.id,due,"daily"]));
  check((await query("select id from guardian_agreement_tasks")).rows,[]);
  check((await query("select id from guardian_agreement_moods")).rows,[]);
  await assert.rejects(accept(a.id));
  await assert.rejects(task(a.id,"propose",null,"After revocation",owner));
  await as(owner);
  check((await query("select shared from guardian_agreement_moods where id=$1",[m.id])).rows,[{shared:true}]);
  await mood(a.id,"unshare",m.id);
  await assert.rejects(mood(a.id,"share",m.id));
  await mood(a.id,"delete",m.id);
  const next = await propose();
  await as(guardian);
  await accept(next.id);
  await db.exec("reset role");
  await query("update caregiver_links set active=false where id=$1",[link]);
  await as(guardian);
  check((await query("select id from guardian_agreements")).rows,[]);
  await revoke(next.id); // Leaving never requires an active connection or approval.
  await db.exec("reset role");
  await query("update caregiver_links set active=true where id=$1",[link]);
  await as(owner);
  check((await query("select status from guardian_agreements where id=$1",[next.id])).rows,[{status:"revoked"}]);
  const changed = await propose();
  await db.exec("reset role");
  await query("update caregiver_links set caregiver_email='stranger@test.invalid' where id=$1",[link]);
  await as(guardian);
  check((await query("select id from guardian_agreements")).rows,[]);
  await as(stranger);
  check((await query("select id from guardian_agreements")).rows,[]);
  await assert.rejects(accept(changed.id));
  await as(owner);
  check((await query("select status from guardian_agreements where id=$1",[changed.id])).rows,[{status:"revoked"}]);
  if (nativeClient) {
    // Separate real PostgreSQL connections prove withdrawal wins against an
    // already queued acceptance; a single-connection mock cannot test this.
    await db.exec("reset role");
    await query("update caregiver_links set caregiver_email='guardian@test.invalid' where id=$1",[link]);
    await as(owner);
    const racing = await propose();
    const {Client} = await import("pg");
    const revoker = new Client({connectionString});
    const accepter = new Client({connectionString});
    await revoker.connect(); await accepter.connect();
    try {
      for (const [client,uid] of [[revoker,owner],[accepter,guardian]]) {
        await client.query("select set_config('request.jwt.claim.sub',$1,false)",[uid]);
        await client.query("set role authenticated");
      }
      await revoker.query("begin");
      await revoker.query("select public.guardian_agreement_action('revoke',$1)",[racing.id]);
      let settled=false;
      const waiting=accepter.query("select public.guardian_agreement_action('accept',$1)",[racing.id]).then(()=>({accepted:true}),error=>({error})).finally(()=>{settled=true});
      await new Promise(r=>setTimeout(r,100));
      check(settled,false);
      await revoker.query("commit");
      assert.ok((await waiting).error,"acceptance queued behind revocation must fail");
      check((await query("select status from guardian_agreements where id=$1",[racing.id])).rows,[{status:"revoked"}]);
      // The new mutation RPCs must also serialize behind consent withdrawal,
      // including task completion that would otherwise create another occurrence.
      for(const operation of ["behavior","notebook","schedule","complete","mood"]){
        await as(owner);
        const agreement=await propose();
        await as(guardian);await accept(agreement.id);
        await as(owner);
        const event=await action("guardian_behavior_action",[agreement.id,"log",null,"Race fixture",null,""]);
        const notebook=await action("guardian_notebook_action",[agreement.id,"create",null,"Race fixture","Original",null]);
        const entry=await mood(agreement.id,"create",null,"Original mood");
        const scheduled=await task(agreement.id,"propose",null,"Optional repeat",guardian);
        await as(guardian);await task(agreement.id,"accept",scheduled.id);
        await action("guardian_task_schedule",[agreement.id,scheduled.id,due,"weekly"]);
        const requests={
          behavior:[guardian,"select public.guardian_behavior_action($1,'score',$2,null,1,'')",[agreement.id,event.guardian_behavior_action]],
          notebook:[owner,"select public.guardian_notebook_action($1,'edit',$2,null,'Changed',1)",[agreement.id,notebook.guardian_notebook_action]],
          schedule:[guardian,"select public.guardian_task_schedule($1,$2,$3,'daily')",[agreement.id,scheduled.id,due]],
          complete:[guardian,"select public.guardian_agreement_task_action($1,'complete',$2)",[agreement.id,scheduled.id]],
          mood:[owner,"select public.guardian_agreement_mood_action($1,'edit',$2,'Changed',false)",[agreement.id,entry.id]],
        };
        const [actor,sql,args]=requests[operation];
        await accepter.query("select set_config('request.jwt.claim.sub',$1,false)",[actor]);
        await revoker.query("begin");
        await revoker.query("select public.guardian_agreement_action('revoke',$1)",[agreement.id]);
        let finished=false;
        const write=accepter.query(sql,args).then(()=>({saved:true}),error=>({error})).finally(()=>{finished=true;});
        await new Promise(resolve=>setTimeout(resolve,100));
        check(finished,false);
        await revoker.query("commit");
        assert.ok((await write).error,operation+" queued behind withdrawal must fail");
        await db.exec("reset role");
        check((await query("select count(*)::int as count from guardian_agreement_tasks where recurrence_origin=$1",[scheduled.id])).rows,[{count:0}]);
        check((await query("select version from guardian_shared_notebooks where id=$1",[notebook.guardian_notebook_action])).rows,[{version:1}]);
      }
    } finally {
      await revoker.query("rollback");
      await revoker.end(); await accepter.end();
    }
  }
  console.log(`Guardian Agreements PostgreSQL authorization checks passed (${checks} assertions plus denial cases). No hosted database accessed.`);
} finally {
  await db.close();
}
