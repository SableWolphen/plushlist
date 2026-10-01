import { deviceStorage } from '../private-save.js';
import { CozyComfortContext } from './cozy-space.jsx';
import { smallerStep, nextLocalDate, readGentleDay, saveGentleDay } from '../gentle-day.js';
import { startFocusTimer } from './focus-timer.jsx';

const button = {minHeight:44,padding:'8px 12px',borderRadius:14,border:'1px solid var(--pl-theme-line)',background:'var(--pl-theme-surface-2)',color:'var(--pl-theme-ink)',font:'inherit',fontSize:14,fontWeight:800,cursor:'pointer'};
const flex = {display:'flex',flexWrap:'wrap',gap:8,marginTop:8};
const input = {width:'100%',boxSizing:'border-box',padding:10,minHeight:44,borderRadius:12,border:'1px solid var(--pl-theme-line)',background:'var(--pl-theme-surface)',color:'var(--pl-theme-ink)',font:'inherit'};

export function GentleDayTools({userId,date,rows=[],viewDone={},dailyCheckIn={},onDayType,onReset,onOpenComfort,onSupport}) {
  const cozy = React.useContext(CozyComfortContext);
  const key = `plushlife:gentle-tools:${userId}:${date}`;
  const [state,setState] = React.useState({});
  const [message,setMessage] = React.useState('');
  const [busy,setBusy] = React.useState(false);
  React.useEffect(()=>{setState(readGentleDay(deviceStorage(),key));setMessage('');},[key]);
  const save = next => {
    if (!saveGentleDay(deviceStorage(),key,next)) {setMessage('Couldn’t save on this device. Please try again.');return false;}
    setState(next);setMessage('Saved privately on this device.');return true;
  };
  const chooseDay = async type => {
    setBusy(true);
    try {const okay=await onDayType?.(type);setMessage(okay===true?'Your day is ready. Choose one small step.':'Couldn’t change your day. Please try again.');}
    catch(_){setMessage('Couldn’t change your day. Please try again.');}finally{setBusy(false);}
  };
  const unfinished=rows.filter(row=>!viewDone[row.key]&&!row.isBonus);
  const selected=unfinished.find(row=>row.key===state.task) || unfinished[0];
  const progress=state.progress || {};
  const tomorrowKey=`plushlife:gentle-tools:${userId}:${nextLocalDate(date)}`;
  const carry = () => {
    const next=readGentleDay(deviceStorage(),tomorrowKey);
    const labels=unfinished.filter(row=>(state.carry || []).includes(row.key)).map(row=>row.label);
    if(!saveGentleDay(deviceStorage(),tomorrowKey,{...next,intentions:labels.slice(0,12)})){setMessage('Couldn’t save tomorrow’s intentions. Please try again.');return;}
    setMessage('Your choices are saved as tomorrow’s intentions on this device. Your task schedule stays as you set it.');
  };
  const keepWin = async () => {
    if(!cozy || cozy.status!=='ready' || !state.win?.trim()) return;
    setBusy(true);
    try {const okay=await cozy.save({...cozy.profile,memories:[{id:crypto.randomUUID(),text:state.win.trim(),date:new Date().toISOString()},...cozy.profile.memories].slice(0,60)});if(okay)save({...state,win:''});else setMessage('Couldn’t keep this win. Your text is still here.');}
    catch(_){setMessage('Couldn’t keep this win. Your text is still here.');}finally{setBusy(false);}
  };
  return <details className="pl-gentle-tools">
    <summary>Make room for today <span>Energy, getting started & a fresh start</span></summary>
    {!!state.intentions?.length&&<section><h3>A starting point from yesterday</h3><ul>{state.intentions.map((text,i)=><li key={i}>{text}</li>)}</ul><button type="button" style={button} onClick={()=>save({...state,intentions:[]})}>Let these go</button></section>}
    <section><h3>What kind of day is this?</h3><div style={flex}>{[['tiny','A little energy'],['soft','Doing okay'],['full','Ready for more'],['rest','Room to rest']].map(([type,label])=><button key={type} type="button" style={button} disabled={busy} aria-pressed={dailyCheckIn.day_type===type} onClick={()=>chooseDay(type)}>{label}</button>)}</div></section>
    <section><h3>Help me start</h3>{selected?<><label style={{display:'grid',gap:6}}>Pick one little thing<select style={input} value={selected.key} onChange={e=>save({...state,task:e.target.value})}>{unfinished.map(row=><option key={row.key} value={row.key}>{row.label}</option>)}</select></label><p>{smallerStep(selected)}</p>{cozy?.profile?.fields?.comfort_item&&<p>Keep {cozy.profile.fields.comfort_item} close while you start.</p>}<div style={flex}><button type="button" style={button} onClick={()=>startFocusTimer({minutes:2,taskLabel:selected.label,step:smallerStep(selected)})}>Try two minutes</button>{[['started','I started'],['partial','I did some']].map(([value,label])=><button key={value} type="button" style={button} aria-pressed={progress[selected.key]===value} onClick={()=>save({...state,progress:{...progress,[selected.key]:progress[selected.key]===value?undefined:value}})}>{label}</button>)}</div><p className="pl-muted-note">Small steps count here. Mark the task done when it meets your own goal.</p></>:<p>You have room to breathe. Rest or visit your comforts.</p>}</section>
    <section><h3>My day got interrupted</h3><p>Keep your progress and choose a way forward.</p><div style={flex}><button type="button" style={button} disabled={busy||cozy?.status!=='ready'} onClick={async()=>{setBusy(true);try{const okay=await onReset?.(cozy.profile);setMessage(okay?'Your essentials are ready for a softer day.':'Couldn’t start your reset. Please try again.');}catch(_){setMessage('Couldn’t start your reset. Please try again.');}finally{setBusy(false);}}}>Keep my essentials</button><button type="button" style={button} disabled={busy} onClick={()=>chooseDay('soft')}>Start fresh from now</button><button type="button" style={button} onClick={onOpenComfort}>What would help right now?</button><button type="button" style={button} onClick={onSupport}>Ask my Guardian</button></div></section>
    <section><h3>A little evening closeout</h3><label style={{display:'grid',gap:6}}>Something that counted today<textarea style={input} maxLength={500} value={state.win || ''} onChange={e=>setState({...state,win:e.target.value})} placeholder="Starting, resting, or asking for help all count."/></label><div style={flex}><button type="button" style={button} onClick={()=>save(state)}>Save my closeout</button><button type="button" style={button} disabled={busy||cozy?.status!=='ready'||!state.win?.trim()} onClick={keepWin}>Keep in my scrapbook</button></div>{!!unfinished.length&&<details><summary>Choose tomorrow’s starting points</summary><p>Save intentions here; edit a task’s date in Little Jobs when you want to reschedule it.</p>{unfinished.map(row=><label key={row.key} style={{display:'flex',alignItems:'center',gap:8,minHeight:44}}><input type="checkbox" checked={(state.carry || []).includes(row.key)} onChange={e=>setState({...state,carry:e.target.checked?[...(state.carry || []),row.key]:(state.carry || []).filter(k=>k!==row.key)})}/>{row.label}</label>)}<button type="button" style={button} onClick={carry}>Keep for tomorrow</button></details>}</section>
    {message&&<p role="status" aria-live="polite">{message}</p>}
  </details>;
}
