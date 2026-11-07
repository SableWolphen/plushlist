/* Local full-app visual fixture. All reads/writes stay in memory. Never a production client. */
(function(){
 const id='00000000-0000-4000-8000-00000000f001', guardian='00000000-0000-4000-8000-00000000f002';
 const stamp=new Date().toISOString(), date=(()=>{let d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')})();
 const user={id,email:'preview@example.invalid',created_at:'2026-10-01T12:00:00Z',user_metadata:{}};
 const tasks=['Drink a glass of water','Take a little walk','Make space for one important thing','A quiet moment before bed'].map((task,i)=>({user_id:id,task_key:'preview-task-'+i,task,day_id:'daily',schedule_type:'weekly',schedule_days:['mon','tue','wed','thu','fri','sat','sun'],section:i<2?'Morning':'Evening',sort_order:i,is_bonus:false,archived_at:null,habit_type:i===0?'build':'regular',estimated_minutes:i===1?10:5}));
 const link={id:'preview-link',owner_user_id:id,caregiver_email:'alex@example.invalid',label:'Alex',active:true,accepted_at:stamp,can_view_progress:false,can_view_tasks:false,can_view_schedule:false,can_view_mood:false,can_send_notes:true,can_use_together:true,created_at:stamp};
 const store={
 app_preferences:[{user_id:id,appearance_theme:'soft',dark_mode:false,nickname_style:'warm',onboarding_complete:true,weekly_intention_intro_seen:true,notification_nudge_dismissed_at:stamp,last_seen_changelog:'',task_group_order:[],reminder_times:[],simple_mode:false}],
 tracker_profiles:[{user_id:id,display_name:'Cozy',show_personal_schedule:true,account_type:'cozy',guardian_read_only:false}],tracker_tasks:tasks,
 daily_progress:[{user_id:id,progress_date:date,completed_keys:['preview-task-0'],updated_at:stamp}],
 daily_check_ins:[{user_id:id,checkin_date:date,mood:'okay',day_type:'soft',energy:'steady',capacity:3,updated_at:stamp}],
 tracker_schedules:[{user_id:id,day_id:'sat',label:'Saturday',entries:[{time:'10:00',text:'A little walk'},{time:'20:30',text:'Make room for rest'}]}],
 caregiver_links:[link],guardian_agreements:[{id:'preview-agreement',caregiver_link_id:link.id,owner_user_id:id,guardian_user_id:guardian,proposed_by:id,mode:'supportive',status:'accepted',accepted_by:guardian,created_at:stamp,expectations:'Ask before offering advice. Make time for a weekly check-in.',boundaries:'Private means private. Either person can stop anytime.'}],
 guardian_agreement_tasks:[{id:'preview-shared-task',agreement_id:'preview-agreement',body:'Make time for tea together',assignee_user_id:id,proposed_by:guardian,status:'accepted',created_at:stamp}],
 guardian_agreement_moods:[{id:'preview-shared-note',agreement_id:'preview-agreement',author_user_id:guardian,body:'A little tired today. Quiet company sounds really nice.',shared:true,created_at:stamp}],
 user_achievements:[{user_id:id,last_visit_date:date,activity_days_total:8,care_days_total:8,best_streak:4}],
 };
 const query=table=>{
 let single=false,filters=[],write=null,head=false,limit=1000;
 let q=new Proxy({}, {get(_,name){
 if(name==='then')return(resolve,reject)=>Promise.resolve().then(()=>{
  if(write){let rows=Array.isArray(write.rows)?write.rows:[write.rows];store[table]??=[];if(write.kind==='delete')store[table]=store[table].filter(r=>!filters.every(f=>f(r)));else for(let row of rows){let key=row.id?'id':row.task_key?'task_key':row.user_id?'user_id':null;let at=key?store[table].findIndex(r=>r[key]===row[key]):-1;if(at>=0)store[table][at]={...store[table][at],...row};else store[table].push({...row});}}
  let data=(store[table]||[]).filter(r=>filters.every(f=>f(r))).slice(0,limit);return {data:head?null:single?(data[0]||null):data,error:null,count:data.length};
 }).then(resolve,reject);
 if(name==='maybeSingle'||name==='single')return()=>{single=true;return q};
 if(name==='select')return(_columns,opts)=>{head=!!opts?.head;return q};
 if(['eq','neq','gt','gte','lt','lte','in','is','ilike'].includes(name))return(k,v)=>{filters.push(r=>name==='eq'||name==='is'?r[k]===v:name==='neq'?r[k]!==v:name==='in'?v.includes(r[k]):name==='ilike'?String(r[k]||'').toLowerCase()===String(v).toLowerCase():name==='gte'?r[k]>=v:name==='lte'?r[k]<=v:name==='gt'?r[k]>v:r[k]<v);return q};
 if(['upsert','insert','update','delete'].includes(name))return rows=>{write={kind:name,rows:rows||{}};return q};
 if(name==='limit')return n=>{limit=n;return q};
 return()=>q;
 }});return q;
 };
 const session={user,access_token:'local-preview-not-a-valid-token',refresh_token:'local-preview-only'};
 const client={from:query,schema(){return this},auth:{getSession:async()=>({data:{session},error:null}),getUser:async()=>({data:{user},error:null}),onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}}),signOut:async()=>({error:null}),refreshSession:async()=>({data:{session},error:null})},rpc(name){if(name==='is_app_admin'){const p=Promise.resolve({data:false,error:null});p.maybeSingle=()=>p;return p;}return query('preview-rpc-'+name)},channel(){const c={on(){return c},subscribe(){return c},unsubscribe(){}};return c;},removeChannel(){},functions:{invoke:async()=>({data:null,error:null})}};
 window.supabase={createClient:()=>client};
 // Any unexpected remote request is blocked independently by the preview CSP.
 window.__plushlifeVisualPreview=true;
})();
