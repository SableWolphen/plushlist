import { CozyCorner } from "./cozy-corner.jsx";
import { WeeklyKeepsake } from "./weekly-keepsake.jsx";
import { privateSave, deviceStorage } from "../private-save.js";
import { COZY_FIELDS, COZY_NEEDS, COZY_STATUSES, COZY_REMINDER_STYLES, normalizeCozyProfile, cozyCardSnapshot, supportPreferenceSummary, cozyComfortSuggestions } from '../cozy-profile.js';

export const CozyComfortContext = React.createContext(null);
const box = { padding: 14, borderRadius: 20, border: '1px solid var(--pl-theme-line)', background: 'var(--pl-theme-surface)', color: 'var(--pl-theme-ink)', marginTop: 10 };
const button = { minHeight: 44, padding: '9px 12px', borderRadius: 14, border: '1px solid var(--pl-theme-line)', background: 'var(--pl-theme-surface-2)', color: 'var(--pl-theme-ink)', font: 'inherit', fontSize: 14, fontWeight: 800, cursor: 'pointer' };
const input = { width: '100%', boxSizing: 'border-box', minHeight: 44, padding: 10, borderRadius: 12, border: '1px solid var(--pl-theme-line)', background: 'var(--pl-theme-surface)', color: 'var(--pl-theme-ink)', font: 'inherit', fontSize: 14 };
const flex = { display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 };

export function CozySetup({ draft, onChange, section = 'all' }) {
  const field = (key,value)=>onChange({...draft,fields:{...draft.fields,[key]:value}});
  const groups = {
    comforts: [['comfort_item','My comfort item','A blanket, plush, or favorite thing'],['sounds','Sounds that help','Soft music, rain, or quiet'],['snacks','A familiar snack','Whatever feels good to you']],
    support: [['helps','What helps on a rough day','A quiet spot, water, a tiny step'],['soft_plan','My Soft Plan','The few things I want to keep on hard days'],['please_dont','Please don’t','No repeated reminders, no surprise calls']],
    anchors: [['little_goal','What I’d like help with','Getting started, routines, bedtime…'],['anchors','My routine anchors','After coffee, before bed…']],
  };
  const fields = section === 'all' ? Object.values(groups).flat() : groups[section] || [];
  return <div style={{display:'grid',gap:12}}>
    <p style={{fontSize:14,lineHeight:1.5,margin:'6px 0'}}>Optional, private, and yours to change. Nothing here is shared automatically.</p>
    {fields.map(([key,label,placeholder])=><label key={key} style={{display:'grid',gap:6,fontSize:14,fontWeight:700}}>{label}<input style={input} value={draft.fields[key]} maxLength={500} placeholder={placeholder} onChange={e=>field(key,e.target.value)}/></label>)}
    {(section==='all'||section==='support')&&<label style={{display:'grid',gap:6,fontSize:14,fontWeight:700}}>How I like encouragement<select style={input} value={draft.reminder_style} onChange={e=>onChange({...draft,reminder_style:e.target.value,fields:{...draft.fields,reminders:e.target.value}})}>{COZY_REMINDER_STYLES.map(s=><option key={s}>{s}</option>)}</select></label>}
  </div>;
}

export function CozyComfortKit({ onSound, soundscapes = [] }) {
  const cozy = React.useContext(CozyComfortContext);
  const [active,setActive] = React.useState('');
  if (!cozy || cozy.status!=='ready') return null;
  const suggestions=cozyComfortSuggestions(cozy.profile);
  const record=async(key,fit)=>{if(await cozy.save({...cozy.profile,comfort_uses:[{key,fit,date:new Date().toLocaleDateString('en-CA')},...cozy.profile.comfort_uses].slice(0,80)}))setActive('');};
  return <section style={box} aria-label="My Comfort Kit"><h4 style={{margin:0,fontSize:17}}>My Comfort Kit</h4><p style={{fontSize:14,margin:'6px 0'}}>Something familiar, whenever you need it.</p>
    {!suggestions.length&&<p style={{fontSize:14}}>Add a comfort below. A blanket, a snack, or quiet all count.</p>}
    {suggestions.map(s=><div key={s.key} style={{marginTop:8}}><button type="button" style={{...button,width:'100%',textAlign:'left'}} aria-expanded={active===s.key} onClick={()=>setActive(active===s.key?'':s.key)}><span style={{display:'block',fontSize:13,color:'var(--pl-theme-muted)'}}>{s.label}</span>{s.text}</button>{s.helped>0&&<p style={{margin:'4px 0',fontSize:13}}>You marked this helpful {s.helped} {s.helped===1?'time':'times'}.</p>}{active===s.key&&<div style={flex}><button type="button" style={button} disabled={cozy.busy} onClick={()=>record(s.key,'helped')}>That helped</button><button type="button" style={button} disabled={cozy.busy} onClick={()=>record(s.key,'not_today')}>Not today</button></div>}</div>)}
    {cozy.profile.reset_sound&&soundscapes.some(s=>s.id===cozy.profile.reset_sound)&&<button type="button" style={{...button,marginTop:10}} onClick={()=>onSound?.(cozy.profile.reset_sound)}>Play my reset sound</button>}
    {cozy.message&&<p role="status" style={{fontSize:14}}>{cozy.message}</p>}
  </section>;
}

export function useCozyComfort(user, client) {
  const [profile, setProfile] = React.useState(normalizeCozyProfile());
  const [cards, setCards] = React.useState([]);
  const [status, setStatus] = React.useState('loading');
  const [message, setMessage] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [version, setVersion] = React.useState(0);
  const saving = React.useRef(false);
  const account = React.useRef(user?.id);
  account.current = user?.id;
  const writer=React.useMemo(()=>privateSave({storage:deviceStorage(),key:`plushlife-cozy-${user?.id}`,client,table:'cozy_profiles',userId:user?.id}),[user?.id,client]);
  React.useEffect(()=>{
    const retry=()=>{if(writer.hasPending())writer.flush().then(ok=>{if(ok && writer.isActive())setMessage('Your comforts are synced privately.');});};
    window.addEventListener('online',retry);
    const timer=setInterval(retry,30000);
    return ()=>{window.removeEventListener('online',retry);clearInterval(timer);writer.dispose();};
  },[writer]);
  React.useEffect(() => {
    let alive = true;
    setProfile(normalizeCozyProfile()); setCards([]); setMessage(''); setBusy(false);
    if (!user?.id || !client) { setStatus('idle'); return; }
    setStatus('loading');
    const pendingAtLoad=writer.hasPending();
    Promise.all([
      client.from('cozy_profiles').select('profile').eq('user_id', user.id).maybeSingle(),
      client.from('cozy_shared_cards').select('*').eq('owner_user_id', user.id),
    ]).then(([own, shared]) => {
      if (!alive) return;
      const cached=writer.read();
      if (own.error && !cached) { setStatus('error'); return; }
      const value=pendingAtLoad || writer.hasPending() || own.error ? cached : own.data?.profile || cached;
      setProfile(normalizeCozyProfile(value)); setCards(shared.data || []); setStatus('ready');
      if(own.error || writer.hasPending())setMessage('Your device comforts are here. Cloud sync will retry.');
      else try{deviceStorage()?.setItem(`plushlife-cozy-${user.id}`,JSON.stringify(normalizeCozyProfile(value)));}catch(_){}
    }).catch(() => { if (alive) {const cached=writer.read();if(cached){setProfile(normalizeCozyProfile(cached));setStatus('ready');setMessage('Your device comforts are here. Cloud sync will retry.');}else setStatus('error');} });
    return () => { alive = false; };
  }, [user?.id, version]);
  const save = async (next) => {
    if (!user?.id || saving.current || status !== 'ready') return false;
    const id = user.id; saving.current=true; setBusy(true); setMessage('Saving your little guide…');
    try {
      const clean = normalizeCozyProfile(next);
      const result=await writer.write(clean,{profile:clean,updated_at:new Date().toISOString()});
      if (account.current !== id) return false;
      if (!result.saved) throw new Error('save failed');
      setProfile(clean); setMessage(result.synced ? 'Saved privately. Shared cards change only when you publish them.' : 'Saved on this device. Cloud sync will retry.'); return true;
    } catch (_) { if (account.current === id) setMessage('Couldn’t save your comforts. Your edits are still here; try again.'); return false; }
    finally { saving.current=false; if (account.current === id) setBusy(false); }
  };
  const publish = async (link, selected, includeMemories, active = true) => {
    if (!user?.id || link.owner_user_id !== user.id || saving.current || status !== 'ready') return false;
    const id = user.id; saving.current=true; setBusy(true); setMessage(active ? 'Saving your sharing choices…' : 'Pausing card sharing…');
    const card = active ? cozyCardSnapshot(profile, selected, includeMemories) : {fields:{},memories:[]};
    try {
      const {data, error} = await client.from('cozy_shared_cards').upsert({link_id:link.id,owner_user_id:id,card,active,updated_at:new Date().toISOString()},{onConflict:'link_id'}).select().single();
      if (account.current !== id) return false;
      if (error) throw error;
      setCards(items => [...items.filter(item => item.link_id !== link.id), data]);
      setMessage(active ? 'Your Guardian can see exactly this saved card.' : 'Card sharing paused. No comfort fields are shared.'); return true;
    } catch (_) { if (account.current === id) setMessage('Couldn’t update sharing. Please try again.'); return false; }
    finally { saving.current=false; if (account.current === id) setBusy(false); }
  };
  return {profile,cards,status,message,busy,save,publish,retry:()=>setVersion(v=>v+1)};
}

function CardContents({ card }) {
  const fields = card?.fields || {};
  const visible = COZY_FIELDS.filter(([key]) => fields[key]);
  return <div>{visible.length ? <dl style={{margin:0}}>{visible.map(([key,label])=><div key={key} style={{marginTop:8}}><dt style={{fontSize:13,fontWeight:800,color:'var(--pl-theme-muted)'}}>{label}</dt><dd style={{margin:'3px 0 0',fontSize:15,whiteSpace:'pre-wrap',overflowWrap:'anywhere'}}>{fields[key]}</dd></div>)}</dl> : <p style={{color:'var(--pl-theme-muted)',fontSize:14}}>No comfort fields selected.</p>}
    {!!card?.memories?.length && <div style={{marginTop:12}}><strong>Our memory shelf</strong>{card.memories.map((memory,i)=><p key={memory.id || i} style={{fontSize:14,whiteSpace:'pre-wrap'}}>{memory.text}</p>)}</div>}
  </div>;
}

export function CozySharing({ links = [] }) {
  const cozy = React.useContext(CozyComfortContext);
  const [linkId,setLinkId] = React.useState('');
  const [selected,setSelected] = React.useState([]);
  const [memories,setMemories] = React.useState([]);
  const accepted = links.filter(link=>link.active && link.accepted_at);
  const link = accepted.find(l=>l.id===linkId) || accepted[0];
  const saved = cozy?.cards.find(card=>card.link_id===link?.id);
  React.useEffect(()=>{setSelected(Object.keys(saved?.card?.fields || {}));setMemories((saved?.card?.memories || []).map(m=>m.id));},[link?.id,saved]);
  if (!cozy) return null;
  return <section style={box} aria-label="Cozy Card sharing"><h3 style={{margin:0,fontSize:18}}>💌 My Cozy Card</h3><p style={{fontSize:14,lineHeight:1.5}}>Share a little guide with one Guardian. You choose every detail; your private feedback stays yours.</p>
    {!link ? <p style={{fontSize:14}}>Accept a Guardian connection below to share a card.</p> : <>
      <label style={{display:'grid',gap:6,fontSize:14}}>Choose a Guardian<select style={input} value={link.id} onChange={event=>setLinkId(event.target.value)}>{accepted.map(l=><option key={l.id} value={l.id}>{l.label || 'Guardian'} · {l.caregiver_email}</option>)}</select></label>
      <p role="status" style={{fontSize:13,fontWeight:800}}>{saved?.active ? 'Card sharing on' : 'Card sharing paused / private'}</p>
      <details><summary style={{minHeight:44,display:'flex',alignItems:'center',fontWeight:800,cursor:'pointer'}}>Choose what to share</summary><div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:4}}>{COZY_FIELDS.filter(([key])=>cozy.profile.fields[key]).map(([key,label])=><label key={key} style={{minHeight:44,display:'flex',alignItems:'center',gap:8,fontSize:14}}><input type="checkbox" checked={selected.includes(key)} onChange={event=>setSelected(keys=>event.target.checked?[...keys,key]:keys.filter(k=>k!==key))}/>{label}</label>)}</div>
      <strong style={{fontSize:14}}>Choose little wins to share</strong>{cozy.profile.memories.map(m=><label key={m.id} style={{minHeight:44,display:'flex',alignItems:'center',gap:8,fontSize:14}}><input type="checkbox" checked={memories.includes(m.id)} onChange={event=>setMemories(ids=>event.target.checked?[...ids,m.id]:ids.filter(id=>id!==m.id))}/>{m.text}</label>)}</details>
      <div style={{...box,background:'var(--pl-theme-surface-2)'}}><strong>What this Guardian will see</strong><CardContents card={cozyCardSnapshot(cozy.profile,selected,memories)}/></div>
      <div style={flex}><button type="button" style={button} disabled={cozy.busy || cozy.status!=='ready'} onClick={()=>cozy.publish(link,selected,memories)}>Publish these choices</button><button type="button" style={button} disabled={cozy.busy || !saved?.active} onClick={()=>cozy.publish(link,[],[],false)}>Pause card sharing</button></div>
      <p style={{fontSize:13,color:'var(--pl-theme-muted)'}}>Pausing this card keeps other sharing permissions unchanged. Use the Guardian’s pause control below to pause the whole connection.</p>
    </>}
    {cozy.status==='error' && <button style={button} type="button" onClick={cozy.retry}>Retry loading my card</button>}
    {cozy.message && <p role="status" style={{fontSize:14}}>{cozy.message}</p>}
  </section>;
}

export function SharedCozyCard({ client, ownerId, userId }) {
  const [state,setState] = React.useState({status:'loading',cards:[]});
  const [version,setVersion] = React.useState(0);
  React.useEffect(()=>{
    let alive=true;setState({status:'loading',cards:[]});
    if(!ownerId || !userId) return ()=>{alive=false;};
    client.from('cozy_shared_cards').select('card,updated_at').eq('owner_user_id',ownerId).eq('active',true).then(({data,error})=>{if(alive)setState({status:error?'error':'ready',cards:data || []});}).catch(()=>{if(alive)setState({status:'error',cards:[]});});
    return ()=>{alive=false;};
  },[ownerId,userId,version]);
  React.useEffect(()=>{const refresh=()=>setVersion(v=>v+1);const timer=setInterval(refresh,30000);document.addEventListener('visibilitychange',refresh);return ()=>{clearInterval(timer);document.removeEventListener('visibilitychange',refresh);};},[ownerId,userId]);
  return <section style={box} aria-label="Shared Cozy Card"><h3 style={{margin:0,fontSize:18}}>🌱 Our Cozy Corner</h3>{state.status==='loading'?<p role="status">Opening the shared card…</p>:state.status==='error'?<><p>Couldn’t load the Cozy Card.</p><button type="button" style={button} onClick={()=>setVersion(v=>v+1)}>Try again</button></>:state.cards.length?state.cards.map((row,i)=><div key={i}><CardContents card={row.card}/><p style={{fontSize:12,color:'var(--pl-theme-muted)'}}>Shared by your Cozy · {new Date(row.updated_at).toLocaleDateString()}</p></div>):<p style={{fontSize:14}}>Your Cozy hasn’t shared a comfort card with you, or sharing is paused.</p>}</section>;
}

export function CozySpace({ comfortItem='', rows=[], viewDone={}, onReset, onSupport, onSettings, onSound, onReminderTime, soundscapes=[], notes=[] }) {
  const cozy=React.useContext(CozyComfortContext);
  const [open,setOpen]=React.useState(()=>{const requested=window.__plushlifeOpenCozySpace===true;window.__plushlifeOpenCozySpace=false;return requested;});
  const [pane,setPane]=React.useState(null);
  const [draft,setDraft]=React.useState(normalizeCozyProfile());
  const [memory,setMemory]=React.useState('');
  const [resetMessage,setResetMessage]=React.useState('');
  const [reflection,setReflection]=React.useState('');
  const weekDate=new Date(); weekDate.setDate(weekDate.getDate()-((weekDate.getDay()+6)%7));
  const week=`${weekDate.getFullYear()}-${String(weekDate.getMonth()+1).padStart(2,'0')}-${String(weekDate.getDate()).padStart(2,'0')}`;
  React.useEffect(()=>{if(cozy?.status==='ready')setDraft(cozy.profile);},[JSON.stringify(cozy?.profile?.fields),JSON.stringify(cozy?.profile?.essentials),cozy?.profile?.pet_name,cozy?.profile?.reset_sound,cozy?.profile?.reminder_style,cozy?.profile?.reminder_time,cozy?.profile?.return_reminders,cozy?.status]);
  React.useEffect(()=>{const show=()=>{setOpen(true);setTimeout(()=>document.getElementById('pl-cozy-space')?.scrollIntoView({block:'start',behavior:'smooth'}),100);};window.addEventListener('plushlife:open-cozy-space',show);return ()=>window.removeEventListener('plushlife:open-cozy-space',show);},[]);
  if(!cozy)return null;
  const field=(key,value)=>setDraft(p=>({...p,fields:{...p.fields,[key]:value}}));
  const save=()=>cozy.save({...cozy.profile,fields:draft.fields,pet_name:draft.pet_name,essentials:draft.essentials,reset_sound:draft.reset_sound,reminder_style:draft.reminder_style,reminder_time:draft.reminder_time,return_reminders:draft.return_reminders});
  const savedFields=cozy.profile.fields;
  const keepWin=async(text)=>{const next={...cozy.profile,memories:[{id:crypto.randomUUID(),text,date:new Date().toISOString()},...cozy.profile.memories].slice(0,60)};if(await cozy.save(next))setMemory('');};
  const feedback=async(noteId,value)=>cozy.save({...cozy.profile,feedback:[{note_id:noteId,value},...cozy.profile.feedback.filter(item=>item.note_id!==noteId)].slice(0,60)});
  return <section id="pl-cozy-space" style={box} aria-label="My Cozy Space">
    <div style={{display:'flex',justifyContent:'space-between',gap:10,alignItems:'center'}}><div><h3 style={{margin:0,fontSize:18}}>🧸 My Cozy Space</h3><p style={{margin:'4px 0 0',fontSize:14,color:'var(--pl-theme-muted)'}}>Things that make me feel more like me.</p></div><button type="button" style={button} aria-expanded={open} onClick={()=>setOpen(v=>!v)}>{open?'Close':'Open'}</button></div>
    {!open && <p style={{fontSize:14,marginBottom:0}}>{savedFields.comfort_item || comfortItem ? `Keep ${savedFields.comfort_item || comfortItem} close.`:'Your comforts, little wins, and a gentler plan.'} {savedFields.need && `Today I need: ${savedFields.need}.`}</p>}
    {open && (cozy.status==='loading'?<p role="status">Opening your little guide…</p>:cozy.status==='error'?<><p>Your comforts couldn’t be loaded. Try again before editing.</p><button type="button" style={button} onClick={cozy.retry}>Try again</button></>:<>
      {!pane ? <><p style={{fontSize:14,lineHeight:1.5}}>Pick one thing, whenever you need it.</p><nav aria-label="Cozy Space choices" style={{display:'grid',gap:8,marginTop:12}}>{[['comforts','My comforts'],['reset','A softer day'],['memories','Little wins']].map(([id,label])=><button key={id} type="button" style={{...button,textAlign:'left'}} onClick={()=>setPane(id)}>{label} →</button>)}</nav></> : <button type="button" style={{...button,marginTop:12}} onClick={()=>setPane(null)}>← My Cozy Space</button>}
      {pane==='comforts' && <>
      <CozyCorner profile={cozy.profile} busy={cozy.busy} onSave={cozy.save}/>
      <CozyComfortKit onSound={onSound} soundscapes={soundscapes}/>
      <details style={{...box,background:'var(--pl-theme-surface-2)'}}><summary style={{minHeight:44,display:'list-item',alignContent:'center',fontWeight:800}}>How I’m feeling · optional</summary><label style={{display:'grid',gap:6,fontSize:14}}>How I’m feeling<select style={input} value={draft.fields.status} onChange={e=>field('status',e.target.value)}><option value="">Choose when you want</option>{COZY_STATUSES.map(s=><option key={s}>{s}</option>)}</select></label><label style={{display:'grid',gap:6,fontSize:14,marginTop:10}}>Today I need<select style={input} value={draft.fields.need} onChange={e=>field('need',e.target.value)}><option value="">What would help?</option>{COZY_NEEDS.map(n=><option key={n}>{n}</option>)}</select></label></details>
      <details style={box}><summary style={{minHeight:44,alignContent:'center',fontWeight:800}}>Personalize my comforts · optional</summary>
      <label style={{display:"grid",gap:6,fontSize:14,marginTop:12}}>My plush’s name<input style={input} maxLength={40} value={draft.pet_name} placeholder="Pick a name, if you’d like" onChange={e=>setDraft(p=>({...p,pet_name:e.target.value}))}/></label>
      {[["identity","A little about me"],["comforts","My Comforts · Comfort Passport"],["signals","My Signals"],["help","How to Help Me"],["space","My Cozy Space"],["routine","My Soft Plan & Routine Anchors"]].map(([group,title])=><details key={group} style={box}><summary style={{minHeight:44,display:'flex',alignItems:'center',fontWeight:800,cursor:'pointer'}}>{title}</summary><div style={{display:'grid',gap:12,marginTop:8}}>{COZY_FIELDS.filter(([key,,section])=>section===group&&!['status','need'].includes(key)).map(([key,label])=><label key={key} style={{display:'grid',gap:5,fontSize:14}}>{label}<textarea style={{...input,resize:'vertical',minHeight:64}} maxLength={500} value={draft.fields[key]} placeholder={key==='comfort_item'?(comfortItem || 'My blanket, plush, or favorite thing'):'Whatever feels right for you'} onChange={e=>field(key,e.target.value)}/></label>)}</div>{group==='space'&&<button type="button" style={{...button,marginTop:10}} onClick={onSettings}>Choose my theme</button>}</details>)}
      </details>
      <div style={flex}><button type="button" style={button} onClick={save} disabled={cozy.busy}>Save my comforts</button><button type="button" style={button} onClick={()=>setDraft(cozy.profile)} disabled={cozy.busy}>Undo unsaved edits</button></div>
      <details style={box}><summary style={{minHeight:44,display:'flex',alignItems:'center',fontWeight:800}}>My reminder choices</summary><p style={{fontSize:14}}>These change the voice of device reminders. Turning notifications on stays optional in Settings.</p><label style={{display:'grid',gap:6,fontSize:14}}>My reminder style<select style={input} value={draft.reminder_style} onChange={e=>setDraft(p=>({...p,reminder_style:e.target.value,fields:{...p.fields,reminders:e.target.value}}))}>{COZY_REMINDER_STYLES.map(s=><option key={s}>{s}</option>)}</select></label><label style={{display:'grid',gap:6,marginTop:10,fontSize:14}}>A time that suits me<input type="time" style={input} value={draft.reminder_time} onChange={e=>setDraft(p=>({...p,reminder_time:e.target.value}))}/></label><label style={{minHeight:44,display:'flex',alignItems:'center',gap:8,fontSize:14}}><input type="checkbox" checked={draft.return_reminders} onChange={e=>setDraft(p=>({...p,return_reminders:e.target.checked}))}/>Offer one gentle return reminder when I’m away</label><button type="button" style={button} disabled={cozy.busy} onClick={save}>Save reminder choices</button>{onReminderTime&&draft.reminder_time&&<button type="button" style={{...button,marginTop:8}} disabled={cozy.busy} onClick={async()=>{if(await save()) await onReminderTime(draft.reminder_time);}}>Use this time for daily reminders</button>}<button type="button" style={{...button,marginTop:8}} onClick={onSettings}>Notification times & quiet hours</button></details>
      </>}
      {pane==='memories' && <WeeklyKeepsake memories={cozy.profile.memories} petName={cozy.profile.pet_name}/>}
      {pane==='memories' && <details style={box} aria-label="Weekly cozy reflection"><summary style={{minHeight:44,display:'list-item',alignContent:'center',fontWeight:800}}>What felt easier this week? · optional</summary>{cozy.profile.reflection_week===week?<p style={{fontSize:14}}>You’ve made room for this week. Your saved reflection is on your memory shelf.</p>:<><p style={{fontSize:14}}>One line is plenty. You can skip this week.</p><textarea aria-label="What felt easier this week?" style={{...input,minHeight:64}} maxLength={500} value={reflection} onChange={e=>setReflection(e.target.value)}/><div style={flex}><button type="button" style={button} disabled={cozy.busy||!reflection.trim()} onClick={async()=>{if(await cozy.save({...cozy.profile,reflection_week:week,memories:[{id:crypto.randomUUID(),text:`This week felt easier: ${reflection.trim()}`,date:new Date().toISOString()},...cozy.profile.memories].slice(0,60)}))setReflection('');}}>Keep this reflection</button><button type="button" style={button} disabled={cozy.busy} onClick={()=>cozy.save({...cozy.profile,reflection_week:week})}>Not this week</button></div></>}</details>}
      {pane==='reset' && <details open style={box}><summary style={{minHeight:44,display:'flex',alignItems:'center',fontWeight:800,cursor:'pointer'}}>🌷 My Reset · My Safe Routine</summary><p style={{fontSize:14}}>Choose up to three caring steps. Reset uses your saved choices, makes today Tiny, and keeps every task saved.</p>
      {rows.filter(r=>!r.isBonus).map(row=><label key={row.key} style={{minHeight:44,display:'flex',gap:8,alignItems:'center',fontSize:14}}><input type="checkbox" checked={draft.essentials.includes(row.key)} disabled={!draft.essentials.includes(row.key)&&draft.essentials.length>=3} onChange={e=>setDraft(p=>({...p,essentials:e.target.checked?[...p.essentials,row.key]:p.essentials.filter(k=>k!==row.key)}))}/>{row.label}</label>)}
      <label style={{display:'grid',gap:6,marginTop:10,fontSize:14}}>Favorite reset sound<select style={input} value={draft.reset_sound} onChange={e=>setDraft(p=>({...p,reset_sound:e.target.value}))}><option value="">Keep it quiet</option>{soundscapes.map(s=><option key={s.id} value={s.id}>{s.label || s.title || s.name}</option>)}</select></label>
      <div style={flex}><button type="button" style={button} disabled={cozy.busy} onClick={save}>Save my reset</button><button type="button" style={button} disabled={cozy.busy} onClick={async()=>{setResetMessage('Making room for a softer day…');try{const okay=await onReset?.(cozy.profile);setResetMessage(okay?'Your Tiny Day is ready. Your comforts are close.':'Couldn’t start your reset. Try again.');}catch(_){setResetMessage('Couldn’t start your reset. Try again.');}}}>Start my saved reset</button></div>{resetMessage&&<p role="status">{resetMessage}</p>}
      <button type="button" style={{...button,marginTop:10}} onClick={onSupport}>Ask a Guardian for a little help</button></details>}
      {pane==='memories' && <details open style={box}><summary style={{minHeight:44,display:'flex',alignItems:'center',fontWeight:800,cursor:'pointer'}}>✨ My Little Wins & Memory Shelf</summary><label style={{display:'grid',gap:6,fontSize:14}}>A moment I want to keep<textarea value={memory} onChange={e=>setMemory(e.target.value)} maxLength={500} style={{...input,minHeight:70}} placeholder="I did this, even on a hard day…"/></label><button type="button" style={{...button,marginTop:8}} disabled={!memory.trim()||cozy.busy} onClick={()=>keepWin(memory.trim())}>Keep this little moment</button>
      {rows.filter(r=>viewDone[r.key]).slice(0,5).map(row=><button key={row.key} type="button" style={{...button,marginTop:8,width:'100%',textAlign:'left'}} disabled={cozy.busy} onClick={()=>keepWin(`I did it: ${row.label}`)}>Keep my win: {row.label}</button>)}
      {cozy.profile.memories.map(m=><article key={m.id} style={{...box,background:'var(--pl-theme-surface-2)'}}><p style={{whiteSpace:'pre-wrap',fontSize:14}}>{m.text}</p><small>{new Date(m.date).toLocaleDateString()}</small><button type="button" disabled={cozy.busy} style={{...button,marginLeft:8}} onClick={()=>cozy.save({...cozy.profile,memories:cozy.profile.memories.filter(item=>item.id!==m.id)})}>Remove</button></article>)}</details>}
      {pane==='comforts' && <details style={box}><summary style={{minHeight:44,display:'flex',alignItems:'center',fontWeight:800,cursor:'pointer'}}>💛 Comfort Notes · What helped me</summary><p style={{fontSize:14}}>{supportPreferenceSummary(cozy.profile)}</p>{notes.map(note=><article key={note.id} style={box}><p style={{fontSize:14,whiteSpace:'pre-wrap'}}>{note.body}</p><div style={flex}>{[['helped','That helped'],['too_much','Too much'],['space','I wanted space'],['liked','I liked that note']].map(([value,label])=><button key={value} type="button" style={button} disabled={cozy.busy} aria-pressed={cozy.profile.feedback.some(f=>f.note_id===note.id&&f.value===value)} onClick={()=>feedback(note.id,value)}>{label}</button>)}</div><button type="button" disabled={cozy.busy} style={{...button,marginTop:8}} onClick={()=>keepWin(note.body)}>Keep this comfort note</button></article>)}</details>}
      {pane==='comforts' && <button type="button" style={{...button,marginTop:12}} onClick={onSupport}>My Safe People & sharing choices</button>}
      {cozy.message&&<p role="status" style={{fontSize:14}}>{cozy.message}</p>}
    </>)}
  </section>;
}
