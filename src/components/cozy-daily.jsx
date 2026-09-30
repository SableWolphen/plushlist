import { CozyComfortContext } from './cozy-space.jsx';
import { cozyComfortSuggestions, cozyNextStep } from '../cozy-profile.js';

const button={minHeight:44,padding:'8px 12px',borderRadius:16,border:'1px solid var(--pl-theme-line)',background:'var(--pl-theme-surface-2)',color:'var(--pl-theme-ink)',font:'inherit',fontSize:14,fontWeight:800,cursor:'pointer'};

export function CozyDaily({ rows=[],viewDone={},dailyCheckIn={},returnGapDays=0,returnBannerDismissed,onDismissReturn,onReset,onUsual,onOpen }) {
  const cozy=React.useContext(CozyComfortContext);
  const [message,setMessage]=React.useState('');
  const [busy,setBusy]=React.useState(false);
  if(!cozy||cozy.status!=='ready')return null;
  const profile=cozy.profile;
  const comfort=cozyComfortSuggestions(profile)[0];
  const returning=returnGapDays>=2&&!returnBannerDismissed;
  if(!returning&&!comfort&&!profile.fields.anchors&&!profile.fields.little_goal&&!profile.fields.need&&!profile.setup)return null;
  const reset=async()=>{setBusy(true);try{const okay=await onReset?.(profile);setMessage(okay?'Your Soft Plan is ready. All your tasks are still saved.':'Couldn’t start your Soft Plan. Try again.');if(okay)onDismissReturn?.(true);}catch(_){setMessage('Couldn’t start your Soft Plan. Try again.');}finally{setBusy(false);}};
  return <section aria-label="Your cozy day" style={{margin:'10px auto',padding:12,borderRadius:20,border:'1px solid var(--pl-theme-line)',background:'var(--pl-theme-surface)',color:'var(--pl-theme-ink)',maxWidth:736}}>
    <h3 style={{fontFamily:'Quicksand, sans-serif',fontSize:17,margin:0}}>{returning?'Glad you’re here':profile.fields.nickname?`A little room for ${profile.fields.nickname}`:'A little room for you'}</h3>
    <p style={{fontSize:14,lineHeight:1.45,margin:'6px 0'}}>{returning?'Want your usual day or a softer one?':profile.fields.need?`Today I need: ${profile.fields.need}.`:profile.fields.little_goal||'Your comforts and one caring step, at your pace.'}</p>
    {comfort&&<p style={{fontSize:14,margin:'6px 0',overflowWrap:'anywhere'}}>Something familiar: {comfort.text}</p>}
    {profile.fields.anchors&&<p style={{fontSize:14,margin:'6px 0'}}>My routine anchor: {profile.fields.anchors}</p>}
    <div style={{display:'flex',flexWrap:'wrap',gap:8,marginTop:8}}>{returning&&<button type="button" style={button} disabled={busy} onClick={async()=>{setBusy(true);try{const okay=await onUsual?.();if(okay!==false)onDismissReturn?.(true);else setMessage('Couldn’t change your day. Try again.');}catch(_){setMessage('Couldn’t change your day. Try again.');}finally{setBusy(false);}}}>Use my usual day</button>}<button type="button" style={button} disabled={busy} onClick={reset}>Use my Soft Plan</button><button type="button" style={button} onClick={onOpen}>{profile.setup?'My Cozy Space':'Set up my Cozy Space'}</button>{returning&&<button type="button" style={button} onClick={()=>onDismissReturn?.(true)}>Maybe later</button>}</div>
    {message&&<p role="status" style={{fontSize:14}}>{message}</p>}
  </section>;
}

export function useCozyNextStep(rows,done,dayType) {
  const cozy=React.useContext(CozyComfortContext);
  return cozy?.status==='ready'?cozyNextStep(cozy.profile,rows,done,dayType):null;
}

export function CozyGuideSuggestions({ rows=[], viewDone={}, dailyCheckIn={}, onOpen }) {
  const cozy=React.useContext(CozyComfortContext);
  const [host,setHost]=React.useState(null);
  React.useEffect(()=>{
    const open=()=>setHost(document.getElementById('plushlife-cozy-guide-suggestion'));
    const close=()=>setHost(null);
    window.addEventListener('plushlife:guide-open',open);window.addEventListener('plushlife:guide-close',close);
    return ()=>{window.removeEventListener('plushlife:guide-open',open);window.removeEventListener('plushlife:guide-close',close);};
  },[]);
  if(!host||!cozy||cozy.status!=='ready')return null;
  const profile=cozy.profile;
  const next=cozyNextStep(profile,rows,viewDone,dailyCheckIn.day_type);
  const comfort=cozyComfortSuggestions(profile)[0];
  return ReactDOM.createPortal(<section style={{padding:12,borderRadius:20,background:'var(--pl-theme-surface,#fff)',color:'var(--pl-theme-ink,#4e3a60)',border:'1px solid var(--pl-theme-line,#e9ddf6)'}} aria-label="PlushGuide for my Cozy Space"><h3 style={{margin:0,fontSize:17}}>A little guide for you</h3>{profile.fields.little_goal&&<p style={{fontSize:14}}>You’d like help with: {profile.fields.little_goal}</p>}<p style={{fontSize:14}}>{next?`One of your chosen caring steps: ${next.label}`:dailyCheckIn.day_type==='rest'?'There’s room to rest. Your Comfort Kit is here if you want it.':'Choose a comfort or one small step that suits today.'}</p>{comfort&&<p style={{fontSize:14}}>Something familiar: {comfort.text}</p>}{profile.fields.encouragement&&<p style={{fontSize:14}}>Your kind of encouragement: {profile.fields.encouragement}</p>}{profile.fields.support_style&&<p style={{fontSize:14}}>How you like support: {profile.fields.support_style}</p>}<button type="button" style={button} onClick={()=>{document.getElementById('plushlife-feature-guide')?.querySelector('.pg-close')?.click();onOpen?.();}}>Show my Cozy Space</button></section>,host);
}
