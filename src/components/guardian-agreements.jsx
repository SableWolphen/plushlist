import { agreementMode, loadAgreements, agreementAction, loadGuardianWorkspace, guardianWorkspaceAction } from "../guardian-agreements.mjs";
import { GUARDIAN_AREAS } from "../guardian-workspace-rules.mjs";

const emptyTerms = () => ({ mode:"supportive", expectations:"", boundaries:"", rewards:"", consequences:"" });
export function GuardianAgreements({client,user,links=[],ready=false}) {
  const [expanded,setExpanded] = React.useState(false);
  const [selected,setSelected] = React.useState("");
  const link = links.find(l=>l.id===selected) || links[0];
  return <details onToggle={event=>setExpanded(event.currentTarget.open)} className="pl-design-card">
    <summary style={{minHeight:44,cursor:"pointer",fontWeight:800}}>Optional Guardian Agreements</summary>
    <p>Supportive Guardian is the default. Accountability starts only when both people agree to the same terms. Either person can stop anytime.</p>
    {expanded && (!ready ? <p role="status">Check your connections before opening agreements.</p> : !link ? <p>Connect with a trusted person first. No agreement is needed for everyday support.</p> : <>
      <label>Relationship <select aria-label="Agreement relationship" value={link.id} onChange={e=>setSelected(e.target.value)}>
        {links.map(l=><option key={l.id} value={l.id}>{l.label || l.caregiver_email || "Trusted person"}{!l.active ? " · paused" : !l.accepted_at ? " · invitation pending" : ""}</option>)}
      </select></label>
      <AgreementWorkspace key={`${user?.id}:${link.id}`} client={client} user={user} link={link}/>
    </>)}
  </details>;
}

export function AgreementWorkspace({client,user,link}) {
  const [data,setData] = React.useState(null);
  const [busy,setBusy] = React.useState(false);
  const [message,setMessage] = React.useState("");
  const [terms,setTerms] = React.useState(emptyTerms);
  const [consent,setConsent] = React.useState(false);
  const [taskBody,setTaskBody] = React.useState("");
  const [moodBody,setMoodBody] = React.useState("");
  const [shareMood,setShareMood] = React.useState(false);
  const [moodPrompt,setMoodPrompt] = React.useState("");
  const [taskView,setTaskView] = React.useState("active");
  const [workspace,setWorkspace] = React.useState(null);
  const [workspaceError,setWorkspaceError] = React.useState("");
  const [eventBody,setEventBody] = React.useState("");
  const [reviewScores,setReviewScores] = React.useState({});
  const [scheduleTask,setScheduleTask] = React.useState(null);
  const [scheduleDue,setScheduleDue] = React.useState("");
  const [scheduleRepeat,setScheduleRepeat] = React.useState("");
  const [noteHistory,setNoteHistory] = React.useState({});
  const [noteTitle,setNoteTitle] = React.useState("");
  const [noteBody,setNoteBody] = React.useState("");
  const [editingNote,setEditingNote] = React.useState(null);
  const [editingMood,setEditingMood] = React.useState(null);
  const [editedMoodBody,setEditedMoodBody] = React.useState("");
  const [assignee,setAssignee] = React.useState("me");
  const [area,setArea] = React.useState("tasks");
  const live = React.useRef(false);
  const generation = React.useRef(0);
  const connected = !!(link.active && link.accepted_at);
  const reload = async () => {
    const request = ++generation.current;
    try {
      const next = await loadAgreements(client,link.id);
      if (live.current && request===generation.current) { setData(next); setMessage(""); }
    } catch (_) {
      if (live.current && request===generation.current) { setData(null); setMessage("Agreements are unavailable. Retry when connected. Your existing support and sharing settings still apply."); }
    }
  };
  React.useEffect(()=>{
    live.current=true;
    reload();
    const refresh = () => { if (document.visibilityState === "visible") reload(); };
    globalThis.document?.addEventListener("visibilitychange",refresh);
    return ()=>{live.current=false;generation.current++;globalThis.document?.removeEventListener("visibilitychange",refresh);};
  },[client,link.id,link.active,link.accepted_at,user?.id]);
  const run = async (kind,args,clear) => {
    if (busy) return;
    setBusy(true);setMessage("");
    try {
      await agreementAction(client,kind,args);
      if (live.current) { clear?.(); await reload(); }
    } catch (_) {
      if (live.current) { setData(null);setMessage("That change could not be confirmed. Refresh to check consent before trying again."); }
    } finally { if (live.current) setBusy(false); }
  };
  const current = data?.agreements.find(a=>a.status!=="revoked");
  React.useEffect(()=>{
    let active=true;
    setWorkspace(null);setWorkspaceError("");
    if(!current || current.status!=="accepted" || !connected || !["behavior","reference"].includes(area)) return ()=>{active=false;};
    loadGuardianWorkspace(client,current.id).then(next=>{if(active)setWorkspace(next);}).catch(()=>{if(active)setWorkspaceError("This area is unavailable until its secure database update is installed. No changes were made.");});
    return ()=>{active=false;};
  },[client,current?.id,current?.status,connected,area]);
  const saveSchedule=async(taskId)=>{
    if(busy || !scheduleDue)return;
    setBusy(true);
    try{
      const {error}=await client.rpc("guardian_task_schedule",{p_agreement_id:current.id,p_task_id:taskId,p_due_on:scheduleDue,p_recurrence:scheduleRepeat||null});
      if(error)throw error;
      setScheduleTask(null);setScheduleDue("");setScheduleRepeat("");
      await reload();
    }catch(_){setMessage("Task schedule was not saved. Check the database update and try again.");}
    finally{if(live.current)setBusy(false);}
  };
  const showHistory=async(noteId)=>{
    const {data,error}=await client.from("guardian_notebook_revisions").select("*").eq("notebook_id",noteId).order("version",{ascending:false}).limit(100);
    if(error){setWorkspaceError("Revision history unavailable.");return;}
    setNoteHistory(prev=>({...prev,[noteId]:data||[]}));
  };
  const runWorkspace=async(kind,args,clear)=>{
    if(busy || !workspace)return;
    setBusy(true);setWorkspaceError("");
    try{
      await guardianWorkspaceAction(client,kind,args);
      clear?.();
      const next=await loadGuardianWorkspace(client,current.id);
      if(live.current)setWorkspace(next);
    }catch(_){if(live.current){setWorkspace(null);setWorkspaceError("Change not confirmed. Refresh and check your connection before retrying.");}}
    finally{if(live.current)setBusy(false);}
  };

  const accepted = connected && current?.status==="accepted";
  const partner = current && (user.id===current.owner_user_id ? current.guardian_user_id : current.owner_user_id);
  const field = (name,label,maxLength=2000) => <label style={{display:"block",marginTop:10}}>{label}
    <textarea aria-label={label} maxLength={maxLength} value={terms[name]} onChange={e=>{setTerms({...terms,[name]:e.target.value});setConsent(false);}} style={{display:"block",width:"100%",boxSizing:"border-box"}}/>
  </label>;
  return <section aria-label="Relationship agreements" aria-busy={busy}>
    <p><strong>{agreementMode(current,link)==="accountability" ? "Accountability · mutually accepted" : "Supportive Guardian"}</strong></p>
    <p>Agreements never grant access to your existing tasks, schedule, mood history or journal. Review those permissions separately in Sharing. Consequences are optional written terms; PlushLife never applies them or changes rewards automatically.</p>
    <button type="button" disabled={busy} onClick={reload}>Refresh agreements</button>
    {message && <p role="status">{message}</p>}
    {!data && !message && <p role="status">Checking agreements…</p>}
    {data && <>
      {!connected && <p>This connection is paused or awaiting acceptance. New agreements and sharing are unavailable.</p>}
      {current && <article>
        <h3>{current.status==="proposed" ? "Proposed agreement" : "Accepted agreement"}</h3>
        <p>Mode: {current.mode}</p>
        {[["expectations","Expectations"],["boundaries","Boundaries"],["rewards","Optional rewards"],["consequences","Optional consequences"]].map(([key,label])=>current[key] && <p key={key} style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}><strong>{label}: </strong>{current[key]}</p>)}
        {current.status==="proposed" && current.proposed_by===user.id && <p>Waiting for the other person to accept these exact terms.</p>}
        {current.status==="proposed" && current.proposed_by!==user.id && connected && <button type="button" disabled={busy} onClick={()=>run("agreement",{p_action:"accept",p_id:current.id})}>I agree to these terms</button>}
        <button type="button" disabled={busy} onClick={()=>run("agreement",{p_action:"revoke",p_id:current.id})}>{current.status==="proposed" ? "Decline / withdraw proposal" : "Revoke agreement now"}</button>
        <p>Changes require withdrawing this agreement and proposing new terms for both people to accept.</p>
      </article>}
      {!current && connected && <fieldset disabled={busy}>
        <legend>Propose an agreement</legend>
        <label>Support style <select aria-label="Agreement mode" value={terms.mode} onChange={e=>{setTerms({...terms,mode:e.target.value,consequences:""});setConsent(false);}}>
          <option value="supportive">Supportive</option><option value="accountability">Accountability · both must opt in</option>
        </select></label>
        {field("expectations","Expectations")}{field("boundaries","Boundaries")}{field("rewards","Optional rewards",1000)}
        {terms.mode==="accountability" && field("consequences","Optional consequences",1000)}
        <label style={{display:"block",marginTop:10}}><input type="checkbox" checked={consent} onChange={e=>setConsent(e.target.checked)}/> I agree to propose these terms, and understand either of us can withdraw at any time.</label>
        <button type="button" disabled={!consent || !terms.expectations.trim() || !terms.boundaries.trim()} onClick={()=>run("agreement",{p_action:"propose",p_link_id:link.id,p_terms:terms},()=>{setTerms(emptyTerms());setConsent(false);})}>Propose for mutual acceptance</button>
      </fieldset>}
      {accepted && <>
        <nav aria-label="Guardian workspace areas" style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:16}}>
          {GUARDIAN_AREAS.map(item=><button key={item.id} type="button" aria-pressed={area===item.id} disabled={busy} onClick={()=>setArea(item.id)} style={{minHeight:44,fontWeight:area===item.id?800:400}}>{item.label}</button>)}
        </nav>
        {area==="behavior" && <section aria-label="Behavior"><h3>Behavior</h3><p>Either person can record an event. Only the designated Guardian evaluator can score in mutually accepted accountability mode. Scores never trigger penalties or remove rewards.</p>
          {workspaceError && <p role="status">{workspaceError}</p>}
          {!workspace && !workspaceError && <p role="status">Loading behavior records…</p>}
          {workspace && <><label>Record event <textarea aria-label="Behavior event" maxLength={1000} value={eventBody} onChange={e=>setEventBody(e.target.value)}/></label>
          <button type="button" disabled={busy || !eventBody.trim()} onClick={()=>runWorkspace("behavior",{p_agreement_id:current.id,p_action:"log",p_body:eventBody.trim()},()=>setEventBody(""))}>Log event</button>
          {workspace.events.map(e=><article key={e.id}><p style={{overflowWrap:"anywhere"}}>{e.body}</p>
            {workspace.reviews.filter(r=>r.event_id===e.id).map(r=><p key={r.id}>Score: {r.score} · {r.reason || "No note"} · {new Date(r.created_at).toLocaleString()}</p>)}
            {current.mode==="accountability" && user.id===current.guardian_user_id && <div><label>Score (-10 to 10) <input type="number" min="-10" max="10" aria-label={"Score event "+e.id} value={reviewScores[e.id]??0} onChange={v=>setReviewScores({...reviewScores,[e.id]:v.target.value})}/></label>
              <button type="button" disabled={busy} onClick={()=>runWorkspace("behavior",{p_agreement_id:current.id,p_action:"score",p_event_id:e.id,p_score:Number(reviewScores[e.id]??0)})}>Record score</button></div>}
          </article>)}</>}
        </section>}
        {area==="reference" && <section aria-label="Reference"><h3>Shared notebooks</h3><p>Both participants can edit shared notes. Concurrent changes are rejected rather than silently overwritten. Accepted agreement terms above cannot be edited here.</p>
          {workspaceError && <p role="status">{workspaceError}</p>}
          {!workspace && !workspaceError && <p role="status">Loading shared notebooks…</p>}
          {workspace && <><label>Notebook title <input aria-label="Notebook title" maxLength={150} value={noteTitle} onChange={e=>setNoteTitle(e.target.value)}/></label>
            <label>Contents <textarea aria-label="Notebook contents" maxLength={20000} value={noteBody} onChange={e=>setNoteBody(e.target.value)}/></label>
            <button type="button" disabled={busy || !noteTitle.trim()} onClick={()=>runWorkspace("notebook",{p_agreement_id:current.id,p_action:"create",p_title:noteTitle.trim(),p_body:noteBody},()=>{setNoteTitle("");setNoteBody("");})}>Create shared notebook</button>
            {workspace.notebooks.map(n=><article key={n.id}><h4>{n.title} · revision {n.version}</h4>
              {editingNote?.id===n.id ? <><textarea aria-label={"Edit notebook "+n.id} maxLength={20000} value={editingNote.body} onChange={e=>setEditingNote({...editingNote,body:e.target.value})}/>
                <button type="button" disabled={busy} onClick={()=>runWorkspace("notebook",{p_agreement_id:current.id,p_action:"edit",p_id:n.id,p_expected_version:editingNote.version,p_body:editingNote.body},()=>setEditingNote(null))}>Save new revision</button>
                <button type="button" onClick={()=>setEditingNote(null)}>Cancel</button></> : <><p style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{n.body}</p><button type="button" disabled={busy} onClick={()=>setEditingNote({id:n.id,version:n.version,body:n.body})}>Edit notebook</button></>}
              <button type="button" disabled={busy} onClick={()=>showHistory(n.id)}>Browse revision history</button>
              {(noteHistory[n.id]||[]).map(rev=><div key={rev.version}><p>Revision {rev.version} · {new Date(rev.created_at).toLocaleString()}</p><pre style={{whiteSpace:"pre-wrap",overflowWrap:"anywhere"}}>{rev.body}</pre><button type="button" disabled={busy} onClick={()=>setEditingNote({id:n.id,version:n.version,body:rev.body})}>Restore as new revision</button></div>)}
            </article>)}</>}
        </section>}
        {area==="tasks" && <section aria-label="Tasks"><h3>Shared tasks</h3><p>Tasks start as suggestions. Only the person doing a task can accept, decline or mark it complete. Missed tasks never trigger consequences.</p>
        <fieldset disabled={busy}><legend>Suggest a shared task</legend>
          <label>Task <input aria-label="Agreement task" maxLength={500} value={taskBody} onChange={e=>setTaskBody(e.target.value)}/></label>
          <label>For <select aria-label="Task assignee" value={assignee} onChange={e=>setAssignee(e.target.value)}><option value="me">Me</option><option value="partner">The other person</option></select></label>
          <button type="button" disabled={!taskBody.trim()} onClick={()=>run("task",{p_agreement_id:current.id,p_action:"propose",p_body:taskBody.trim(),p_assignee:assignee==="me" ? user.id : partner},()=>setTaskBody(""))}>Suggest task</button>
        </fieldset>
        <label>Show tasks <select aria-label="Shared task view" value={taskView} onChange={e=>setTaskView(e.target.value)}><option value="active">Active suggestions and accepted tasks</option><option value="history">Completed and declined history</option><option value="all">All tasks</option></select></label>
        {data.tasks.filter(t=>t.agreement_id===current.id && (taskView==="all" || (taskView==="history" ? ["completed","declined","withdrawn"].includes(t.status) : ["proposed","accepted"].includes(t.status)))).map(t=><article key={t.id}>
          <p style={{overflowWrap:"anywhere"}}>{t.body} · {t.status} · {t.assignee_user_id===user.id ? "for you" : "for the other person"}</p>
          {t.assignee_user_id===user.id && (t.status==="proposed" ? ["accept","decline"] : t.status==="accepted" ? ["complete"] : []).map(action=><button key={action} type="button" disabled={busy} onClick={()=>run("task",{p_agreement_id:current.id,p_action:action,p_id:t.id})}>{action=== "complete" ? "Mark complete" : action=== "accept" ? "Accept task" : "Decline task"}</button>)}
          {t.due_on && <p>Due: {t.due_on}{t.recurrence ? " · repeats "+t.recurrence : ""}</p>}
          {t.assignee_user_id===user.id && t.status==="accepted" && (scheduleTask===t.id ? <div><label>Due date <input aria-label="Task due date" type="date" value={scheduleDue} onChange={e=>setScheduleDue(e.target.value)}/></label><label>Repeat <select aria-label="Task repeat" value={scheduleRepeat} onChange={e=>setScheduleRepeat(e.target.value)}><option value="">Once</option><option value="daily">Daily</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></select></label><button type="button" disabled={busy||!scheduleDue} onClick={()=>saveSchedule(t.id)}>Save schedule</button><button type="button" onClick={()=>setScheduleTask(null)}>Cancel</button></div> : <button type="button" disabled={busy} onClick={()=>{setScheduleTask(t.id);setScheduleDue(t.due_on||"");setScheduleRepeat(t.recurrence||"");}}>Schedule task</button>)}
          {t.proposed_by===user.id && ["proposed","accepted"].includes(t.status) && <button type="button" disabled={busy} onClick={()=>run("task",{p_agreement_id:current.id,p_action:"withdraw",p_id:t.id})}>Withdraw task</button>}
        </article>)}
        </section>}
        {area==="moods" && <section aria-label="Moods"><h3>Mood check-in</h3><p>Each new entry is private unless you choose to share it with this person. Your existing mood history stays separate.</p>
        <fieldset disabled={busy}><legend>Write a check-in</legend>
          <label>Optional gentle prompt <select aria-label="Mood prompt" value={moodPrompt} onChange={e=>setMoodPrompt(e.target.value)}><option value="">No prompt</option><option value="How am I feeling right now?">How am I feeling right now?</option><option value="What support would help today?">What support would help today?</option><option value="What went well today?">What went well today?</option></select></label>
          <textarea aria-label="Agreement mood check-in" maxLength={500} value={moodBody} onChange={e=>setMoodBody(e.target.value)}/>
          <label><input type="checkbox" checked={shareMood} onChange={e=>setShareMood(e.target.checked)}/> Share this entry with this person</label>
          <button type="button" disabled={!moodBody.trim()} onClick={()=>run("mood",{p_agreement_id:current.id,p_action:"create",p_body:(moodPrompt ? moodPrompt+"\n" : "")+moodBody.trim(),p_shared:shareMood},()=>{setMoodBody("");setMoodPrompt("");setShareMood(false);})}>{shareMood ? "Save and share entry" : "Save private entry"}</button>
        </fieldset></section>}
      </>}
      {area==="moods" && !!data.moods.length && <h3>Check-in entries</h3>}
      {area==="moods" && data.moods.map(m=><article key={m.id}>
        <p style={{overflowWrap:"anywhere"}}>{m.body} · {m.shared ? "Shared with this relationship" : "Private · only you"}</p>
        {m.author_user_id===user.id && <>
          {accepted && m.agreement_id===current.id && (editingMood===m.id ? <div><textarea aria-label="Edit mood entry" maxLength={500} value={editedMoodBody} onChange={e=>setEditedMoodBody(e.target.value)}/><button type="button" disabled={busy || !editedMoodBody.trim()} onClick={()=>run("mood",{p_agreement_id:m.agreement_id,p_action:"edit",p_id:m.id,p_body:editedMoodBody.trim()},()=>{setEditingMood(null);setEditedMoodBody("");})}>Save mood edit</button><button type="button" onClick={()=>setEditingMood(null)}>Cancel edit</button></div> : <button type="button" disabled={busy} onClick={()=>{setEditingMood(m.id);setEditedMoodBody(m.body);}}>Edit entry</button>)}
          {(m.shared || (accepted && m.agreement_id===current.id)) && <button type="button" disabled={busy} onClick={()=>run("mood",{p_agreement_id:m.agreement_id,p_action:m.shared ? "unshare" : "share",p_id:m.id})}>{m.shared ? "Make private" : "Share with this person"}</button>}
          <button type="button" disabled={busy} onClick={()=>run("mood",{p_agreement_id:m.agreement_id,p_action:"delete",p_id:m.id})}>Delete entry</button>
        </>}
      </article>)}
      {data.agreements.some(a=>a.status==="revoked") && <p>Previous agreements are revoked. Reconnecting never restores their consent.</p>}
    </>}
  </section>;
}
