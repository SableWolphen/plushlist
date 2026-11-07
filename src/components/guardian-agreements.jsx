import { agreementMode, loadAgreements, agreementAction } from "../guardian-agreements.mjs";
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
        {area==="behavior" && <section aria-label="Behavior"><h3>Behavior</h3><p>Behavior logging and evaluator-only scoring are not available yet. No scores or corrections are being recorded. Your agreement and privacy controls remain unchanged.</p></section>}
        {area==="reference" && <section aria-label="Reference"><h3>Reference</h3><p>Shared notebooks with revision history are not available yet. Your accepted agreement terms above remain read-only; propose a new agreement to change them.</p></section>}
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
          {(m.shared || (accepted && m.agreement_id===current.id)) && <button type="button" disabled={busy} onClick={()=>run("mood",{p_agreement_id:m.agreement_id,p_action:m.shared ? "unshare" : "share",p_id:m.id})}>{m.shared ? "Make private" : "Share with this person"}</button>}
          <button type="button" disabled={busy} onClick={()=>run("mood",{p_agreement_id:m.agreement_id,p_action:"delete",p_id:m.id})}>Delete entry</button>
        </>}
      </article>)}
      {data.agreements.some(a=>a.status==="revoked") && <p>Previous agreements are revoked. Reconnecting never restores their consent.</p>}
    </>}
  </section>;
}
