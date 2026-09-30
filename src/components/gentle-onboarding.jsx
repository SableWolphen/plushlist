const fieldStyle = {width:'100%',boxSizing:'border-box',minHeight:48,padding:'10px 12px',borderRadius:14,border:'1px solid var(--pl-theme-line,#e9ddf6)',background:'var(--pl-theme-surface-2,#f7f1fb)',color:'inherit',font:'inherit'};

export function GentleOnboarding({ name, onName, reason, onReason, mode, onMode, onFinish, busy, message, invitationCount=0 }) {
  const guardian = mode === 'supporter';
  return <div role="dialog" aria-modal="true" aria-labelledby="gentle-welcome-title" style={{position:'fixed',inset:0,zIndex:70,display:'grid',placeItems:'center',padding:18,background:'rgba(45,32,56,.42)',backdropFilter:'blur(5px)'}}>
    <form onSubmit={event=>{event.preventDefault();if(name.trim()&&!busy)onFinish();}} style={{width:'min(100%,400px)',boxSizing:'border-box',maxHeight:'calc(100dvh - 36px)',overflowY:'auto',padding:22,borderRadius:24,border:'1px solid var(--pl-theme-line,#e9ddf6)',background:'var(--pl-theme-surface,#fff)',color:'var(--pl-theme-ink,#4e3a60)',fontFamily:'Nunito, sans-serif'}}>
      <img src="./assets/plushlife-mascot.svg" width="80" height="80" alt="" style={{display:'block',margin:'0 auto 8px'}}/>
      <h2 id="gentle-welcome-title" style={{fontFamily:'Quicksand, sans-serif',fontSize:23,margin:'0 0 6px'}}>Let’s start small.</h2>
      <p style={{fontSize:14,lineHeight:1.5,margin:'0 0 16px',color:'var(--pl-theme-muted,#8d7898)'}}>A name is all you need. Make this space yours as you go.</p>
      <label style={{display:'grid',gap:6,fontSize:14,fontWeight:800}}>What should we call you?
        <input autoFocus required autoComplete="nickname" value={name} disabled={busy} onChange={event=>onName(event.target.value)} maxLength={40} placeholder="Your name or nickname" style={fieldStyle}/>
      </label>
      {guardian ? <div style={{fontSize:14,lineHeight:1.5,marginTop:16}}><strong>You’re here as a Guardian.</strong><p>Open invitations sent to your signed-in email. Your Cozy chooses what to share.</p>{invitationCount>0&&<p>{invitationCount} invitation{invitationCount===1?'':'s'} waiting.</p>}</div> : <fieldset style={{border:0,padding:0,margin:'16px 0 0'}}>
        <legend style={{fontSize:14,fontWeight:800}}>What would help today? <span style={{fontWeight:400}}>Optional</span></legend>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:8}}>{[['focus','Getting started'],['burnout','A gentler day'],['general','Daily routines']].map(([value,label])=><button key={value} type="button" disabled={busy} aria-pressed={reason===value} onClick={()=>onReason(reason===value?null:value)} style={{minHeight:44,padding:'8px 12px',borderRadius:14,border:'1px solid var(--pl-theme-line,#e9ddf6)',background:reason===value?'var(--pl-theme-accent,#775298)':'var(--pl-theme-surface-2,#f7f1fb)',color:reason===value?'#fff':'inherit',font:'inherit',fontSize:14}}>{label}</button>)}</div>
      </fieldset>}
      <p style={{fontSize:13,lineHeight:1.5,color:'var(--pl-theme-muted,#8d7898)',margin:'14px 0'}}>Comforts, reminders, and Guardian connections can wait.</p>
      {message&&<p role="status" style={{fontSize:14,lineHeight:1.5}}>{message}</p>}
      <button type="submit" disabled={busy||!name.trim()} style={{width:'100%',minHeight:48,padding:12,border:0,borderRadius:16,background:'var(--pl-theme-accent,#775298)',color:'#fff',font:'inherit',fontWeight:800,opacity:(busy||!name.trim())?0.5:1}}>{busy?'Opening your space…':guardian?'Open Guardian invitations':'Let’s begin'}</button>
      <button type="button" disabled={busy} onClick={()=>onMode(guardian?'cozy':'supporter')} style={{display:'block',margin:'8px auto 0',minHeight:44,padding:8,border:0,background:'transparent',color:'inherit',font:'inherit',fontSize:13,textDecoration:'underline'}}>{guardian?'I’m here for myself':'Here to support someone? Guardian invitations'}</button>
    </form>
  </div>;
}
