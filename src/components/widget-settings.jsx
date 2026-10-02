import { widgetSnapshot } from '../widget-model.js';
import { ThemeWorldContext } from './theme-world.jsx';

export function WidgetSettings({ rows=[], viewDone={}, dailyCheckIn={}, pct=0, weeklyOverallPct=0 }) {
  const context=React.useContext(ThemeWorldContext);
  const [busy,setBusy]=React.useState(false);
  const [message,setMessage]=React.useState('');
  const [mode,setMode]=React.useState('list');
  const snapshot=widgetSnapshot({rows,viewDone,dayType:dailyCheckIn.day_type,progress:pct,weeklyProgress:weeklyOverallPct,theme:context.world});
  const bridge=window.Capacitor?.Plugins?.WidgetBridge;
  const available=!!bridge?.updateWidget && !!window.Capacitor?.isNativePlatform?.();
  const card={padding:16,borderRadius:22,border:'1px solid var(--pl-theme-line)',background:'var(--pl-theme-surface)',color:'var(--pl-theme-ink)'};
  const previewCard={...card,background:'linear-gradient(145deg,#FFF0FA,#F7F0FF 52%,#EAF7FF)',border:'1px solid #DEC5E8',boxShadow:'0 12px 28px rgba(112,70,132,.12)'};
  const btn={minHeight:44,padding:'9px 12px',borderRadius:13,border:'1px solid var(--pl-theme-line)',background:'var(--pl-theme-surface-2)',color:'var(--pl-theme-ink)',font:'inherit',fontSize:14,fontWeight:800,cursor:'pointer'};
  const sync=async()=>{
    if(!available||busy)return;
    setBusy(true);setMessage('Refreshing your Android widget…');
    try{const result=await bridge.updateWidget(snapshot);if(!result?.updated)throw new Error('Device did not confirm sync');setMessage('Widget refreshed 💜');}
    catch(_){setMessage('Couldn’t refresh the widget. Open PlushLife again and try once more.');}
    finally{setBusy(false);}
  };
  return <section style={card} aria-label="Home-screen widget settings">
    <h3 style={{margin:'0 0 6px',fontSize:18}}>📱 A little PlushLife on Home</h3>
    <p style={{margin:'0 0 12px',fontSize:14,lineHeight:1.5,color:'var(--pl-theme-muted)'}}>Your next caring steps, in your theme. Resize the Android widget to fit your space.</p>
    <div role="group" aria-label="Widget size preview" style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:12}}>{[['single','Small preview'],['list','Roomy preview']].map(([value,label])=><button type="button" key={value} aria-pressed={mode===value} style={{...btn,borderWidth:mode===value?2:1}} onClick={()=>setMode(value)}>{label}</button>)}</div>
    <div style={{...previewCard,padding:14}} aria-label="Widget preview">
      <div style={{display:'grid',gridTemplateColumns:'38px 1fr auto',gap:8,alignItems:'center'}}>
        <div style={{fontSize:27,textAlign:'center'}} aria-hidden="true">🧸</div>
        <div><div style={{fontSize:10,fontWeight:900,letterSpacing:'.08em',color:'#8C5B9A'}}>PLUSH LIFE · {snapshot.dayType.toUpperCase()}</div><div style={{fontSize:16,fontWeight:950,color:'#4F2E68',marginTop:1}}>One little step ✨</div></div>
        <div style={{fontSize:20,fontWeight:900,color:'#9B5EB0'}} aria-hidden="true">↻</div>
      </div>
      {snapshot.tasks.length?<div style={{marginTop:10,display:'grid',gap:6}}>{snapshot.tasks.slice(0,mode==='single'?1:3).map(task=><div key={task.key} style={{padding:'7px 9px',display:'grid',gridTemplateColumns:'34px 1fr',gap:8,alignItems:'center',fontSize:14,border:'1px solid '+(task.done?'#BFDCCF':'#E6D6EC'),borderRadius:14,background:task.done?'#EAFBF3':'rgba(255,255,255,.9)'}}><span aria-label={task.done?'Done':'Not done'} style={{fontSize:22,fontWeight:900,color:task.done?'#4B7F68':'#B34BC7',textAlign:'center'}}>{task.done?'✓':'○'}</span><span style={{minWidth:0,overflowWrap:'anywhere',fontWeight:850,color:task.done?'#4B7F68':'#4F405A'}}>{task.label}</span></div>)}</div>:<p style={{fontSize:15,fontWeight:900,padding:'10px 12px',borderRadius:14,background:'rgba(255,255,255,.86)'}}>{snapshot.nextTask}</p>}
      {snapshot.tasks.length>0&&<div style={{fontSize:11,textAlign:'center',marginTop:6,color:'#806B91',fontWeight:800}}>Tap ○ on Android to check it off right on Home ✨</div>}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginTop:10}}>{[['Today',snapshot.progress],['Week',snapshot.weeklyProgress]].map(([label,value])=><div key={label} style={{padding:'8px',borderRadius:12,background:'rgba(255,255,255,.78)',border:'1px solid #E8DCEF'}}><div style={{display:'flex',justifyContent:'space-between',fontSize:11,marginBottom:5,fontWeight:850}}><span>{label}</span><b>{value}%</b></div><div role="progressbar" aria-label={`${label} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} style={{height:7,borderRadius:20,background:'#E9DDF0',overflow:'hidden'}}><div style={{height:'100%',width:`${value}%`,background:label==='Today'?'linear-gradient(90deg,#B34BC7,#D968BA)':'linear-gradient(90deg,#61BFEA,#74CFC2)'}}/></div></div>)}</div>
    </div>
    <p style={{fontSize:13,color:'var(--pl-theme-muted)',lineHeight:1.5}}>On Android, tap the circle to check or uncheck a task without opening PlushLife. Tap the task name to open the app. Resize the widget to show more steps.</p>
    {available?<button type="button" disabled={busy} onClick={sync} style={btn}>{busy?'Refreshing…':'Refresh my Android widget'}</button>:<p role="status" style={{fontSize:14,fontWeight:800}}>The home-screen widget is available in the Android app. This browser shows a preview.</p>}
    {message&&<p role="status" style={{fontSize:14,lineHeight:1.5}}>{message}</p>}
    <details style={{marginTop:10}}><summary style={{minHeight:44,display:'flex',alignItems:'center',fontSize:14,fontWeight:800,cursor:'pointer'}}>Add it to my Android Home screen</summary><ol style={{paddingLeft:20,fontSize:14,lineHeight:1.7}}><li>Long-press an empty space on your Home screen.</li><li>Open Widgets and choose PlushLife.</li><li>Place the widget, then drag its edges to resize.</li></ol><p style={{fontSize:13}}>Your widget updates as you use PlushLife. Sign out clears its personal task data.</p></details>
  </section>;
}
