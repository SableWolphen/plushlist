const fieldStyle = {width:'100%',boxSizing:'border-box',minHeight:48,padding:'10px 12px',borderRadius:14,border:'1px solid var(--pl-theme-line,#e9ddf6)',background:'var(--pl-theme-surface-2,#f7f1fb)',color:'inherit',font:'inherit'};

export function GentleOnboarding({ name, onName, reason, onReason, mode, onMode, onFinish, onClose, busy, message, invitationCount=0, firstTask="Drink water", onFirstTask }) {
  const guardian = mode === 'supporter';
  return <div role="dialog" aria-modal="true" aria-labelledby="gentle-welcome-title" style={{position:'fixed',inset:0,zIndex:70,display:'grid',placeItems:'center',padding:18,background:'rgba(45,32,56,.42)',backdropFilter:'blur(5px)'}}>
    <form onSubmit={event=>{event.preventDefault();if(name.trim()&&!busy)onFinish();}} style={{position:'relative',width:'min(100%,400px)',boxSizing:'border-box',maxHeight:'calc(100dvh - 36px)',overflowY:'auto',padding:22,borderRadius:24,border:'1px solid var(--pl-theme-line,#e9ddf6)',background:'var(--pl-theme-surface,#fff)',color:'var(--pl-theme-ink,#4e3a60)',fontFamily:'Nunito, sans-serif'}}>
      {onClose && <button type="button" aria-label="Close welcome" disabled={busy} onClick={onClose} style={{position:'absolute',top:10,right:10,width:44,height:44,borderRadius:999,border:'1px solid var(--pl-theme-line,#e9ddf6)',background:'var(--pl-theme-surface,#fff)',color:'var(--pl-theme-muted,#8d7898)',fontSize:20,fontWeight:900,cursor:busy?'default':'pointer'}}>×</button>}
      <img src="./assets/plushlife-mascot.svg" width="80" height="80" alt="" style={{display:'block',margin:'0 auto 8px'}}/>
      <h2 id="gentle-welcome-title" style={{fontFamily:'Quicksand, sans-serif',fontSize:23,margin:'0 0 6px'}}>Let’s start small.</h2>
      <p style={{fontSize:14,lineHeight:1.5,margin:'0 0 12px',color:'var(--pl-theme-muted,#8d7898)'}}>A name is all you need. Make this space yours as you go.</p>
      {!guardian && <details style={{padding:12,borderRadius:16,background:'var(--pl-theme-surface-2,#f7f1fb)',border:'1px solid var(--pl-theme-line,#e9ddf6)',fontSize:13,lineHeight:1.45,marginBottom:14}}><summary style={{minHeight:44,cursor:"pointer",fontWeight:800}}>How PlushLife works</summary><strong>You’re the Cozy — this is your space.</strong><div style={{marginTop:5}}>Your Plush is your little companion: it reacts to progress, earns rewards with you, and can be customized.</div><div style={{marginTop:5}}><strong>Tasks</strong> are things to do · <strong>Habits</strong> are things you repeat · <strong>Schedule</strong> is when things happen.</div></details>}
      <label style={{display:'grid',gap:6,fontSize:14,fontWeight:800}}>What should we call you?
        <input autoFocus required autoComplete="nickname" value={name} disabled={busy} onChange={event=>onName(event.target.value)} maxLength={40} placeholder="Your name or nickname" style={fieldStyle}/>
      </label>
      {guardian ? <div style={{fontSize:14,lineHeight:1.5,marginTop:16}}><strong>You’re here as a Guardian.</strong><p>A Guardian is someone a Cozy chooses to support them — a partner, parent, friend, caregiver, or another trusted person. Open invitations sent to your signed-in email. Your Cozy chooses exactly what to share.</p>{invitationCount>0&&<p>{invitationCount} invitation{invitationCount===1?'':'s'} waiting.</p>}</div> : <fieldset style={{border:0,padding:0,margin:'16px 0 0'}}>
        <legend style={{fontSize:14,fontWeight:800}}>What would help today? <span style={{fontWeight:400}}>Optional</span></legend>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:8}}>{[['focus','Getting started'],['burnout','A gentler day'],['general','Daily routines']].map(([value,label])=><button key={value} type="button" disabled={busy} aria-pressed={reason===value} onClick={()=>onReason(reason===value?null:value)} style={{minHeight:44,padding:'8px 12px',borderRadius:14,border:'1px solid var(--pl-theme-line,#e9ddf6)',background:reason===value?'var(--pl-theme-accent,#775298)':'var(--pl-theme-surface-2,#f7f1fb)',color:reason===value?'#fff':'inherit',font:'inherit',fontSize:14}}>{label}</button>)}</div>
      </fieldset>}
      <p style={{fontSize:13,lineHeight:1.5,color:'var(--pl-theme-muted,#8d7898)',margin:'14px 0'}}>{guardian ? "Nothing is shared until the Cozy chooses it." : "You can change your tasks and explore other tools whenever you’re ready."}</p>
      {!guardian && <div style={{marginTop:14,padding:12,border:"1px solid var(--pl-theme-line)",borderRadius:14,background:"var(--pl-theme-surface-2)"}}>
        <strong style={{fontSize:14}}>🌱 Pick your first little step</strong>
        <p style={{fontSize:12,margin:"5px 0 8px",color:"var(--pl-theme-muted)",lineHeight:1.4}}>We’ll put just this one on your list. You can change it or add more anytime.</p>
        <div role="group" aria-label="Choose your first task" style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {["Drink water","Brush my teeth","Make my bed","Take three breaths"].map(task=><button type="button" key={task} disabled={busy} aria-pressed={firstTask===task} onClick={()=>onFirstTask?.(task)} style={{minHeight:40,borderRadius:12,padding:"8px 10px",border:"1px solid var(--pl-theme-line)",borderWidth:firstTask===task?2:1,background:firstTask===task?"var(--pl-theme-surface)":"transparent",color:"var(--pl-theme-ink)",font:"inherit",fontSize:12,fontWeight:800}}>{task}</button>)}
        </div>
        <label style={{fontSize:12,fontWeight:800,display:"block",marginTop:9}}>Or make it your own<input value={firstTask} disabled={busy} onChange={e=>onFirstTask?.(e.target.value)} maxLength={140} style={{...fieldStyle,marginTop:5,minHeight:43}} aria-label="My first little task"/></label>
      </div>}
      {message&&<p role="status" style={{fontSize:14,lineHeight:1.5}}>{message}</p>}
      <button type="submit" disabled={busy||!name.trim()} style={{width:'100%',minHeight:48,padding:12,border:0,borderRadius:16,background:'var(--pl-theme-accent,#775298)',color:'#fff',font:'inherit',fontWeight:800,opacity:(busy||!name.trim())?0.5:1}}>{busy?'Opening your space…':guardian?'Open Guardian invitations':'Let’s begin'}</button>
      <button type="button" disabled={busy} onClick={()=>onMode(guardian?'cozy':'supporter')} style={{display:'block',margin:'8px auto 0',minHeight:44,padding:8,border:0,background:'transparent',color:'inherit',font:'inherit',fontSize:13,textDecoration:'underline'}}>{guardian?'I’m here for myself':'Here to support someone? Guardian invitations'}</button>
    </form>
  </div>;
}
