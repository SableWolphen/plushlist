import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";

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
  const t = await task(a.id,"propose",null,"Drink water if wanted",owner);
  await assert.rejects(task(a.id,"accept",t.id));
  await assert.rejects(task(a.id,"complete",t.id));
  await assert.rejects(task(a.id,"propose",null,"Wrong relationship",other));
  await as(owner);
  await assert.rejects(task(a.id,"complete",t.id));
  check((await task(a.id,"accept",t.id)).status,"accepted");
  check((await task(a.id,"complete",t.id)).status,"completed");
  await assert.rejects(task(a.id,"accept",t.id));
  const declined = await task(a.id,"propose",null,"Optional",guardian);
  const m = await mood(a.id,"create",null,"Feeling quiet today");
  check(m.shared,false);
  await as(guardian);
  check((await query("select id from guardian_agreement_moods")).rows,[]);
  await assert.rejects(mood(a.id,"share",m.id));
  check((await task(a.id,"decline",declined.id)).status,"declined");
  await as(owner);
  await mood(a.id,"share",m.id);
  await as(guardian);
  check((await query("select body from guardian_agreement_moods")).rows,[{body:"Feeling quiet today"}]);
  await as(other);
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
    } finally {
      await revoker.query("rollback");
      await revoker.end(); await accepter.end();
    }
  }
  console.log(`Guardian Agreements PostgreSQL authorization checks passed (${checks} assertions plus denial cases). No hosted database accessed.`);
} finally {
  await db.close();
}
