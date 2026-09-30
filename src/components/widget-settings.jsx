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
    <div style={{...card,background:'var(--pl-theme-surface-2)',padding:14}} aria-label="Widget preview">
      <div style={{display:'flex',justifyContent:'space-between',gap:8,fontSize:13,fontWeight:800}}><span>PlushLife 💜</span><span>{snapshot.dayType}</span></div>
      {snapshot.tasks.length?<div style={{marginTop:10}}>{snapshot.tasks.slice(0,mode==='single'?1:3).map(task=><div key={task.key} style={{padding:'9px 0',display:'flex',gap:10,fontSize:15,borderBottom:'1px solid var(--pl-theme-line)'}}><span aria-label={task.done?'Done':'Not done'}>{task.done?'✓':'○'}</span><span style={{minWidth:0,overflowWrap:'anywhere'}}>{task.label}</span></div>)}</div>:<p style={{fontSize:16,fontWeight:800}}>{snapshot.nextTask}</p>}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginTop:12}}>{[['Today',snapshot.progress],['Week',snapshot.weeklyProgress]].map(([label,value])=><div key={label}><div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:5}}><span>{label}</span><b>{value}%</b></div><div role="progressbar" aria-label={`${label} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} style={{height:7,borderRadius:20,background:'var(--pl-theme-line)',overflow:'hidden'}}><div style={{height:'100%',width:`${value}%`,background:'var(--pl-theme-accent)'}}/></div></div>)}</div>
    </div>
    <p style={{fontSize:13,color:'var(--pl-theme-muted)',lineHeight:1.5}}>Preview only. On Android, tap an unfinished step to open the app and complete it. Resize the placed widget to show more steps.</p>
    {available?<button type="button" disabled={busy} onClick={sync} style={btn}>{busy?'Refreshing…':'Refresh my Android widget'}</button>:<p role="status" style={{fontSize:14,fontWeight:800}}>The home-screen widget is available in the Android app. This browser shows a preview.</p>}
    {message&&<p role="status" style={{fontSize:14,lineHeight:1.5}}>{message}</p>}
    <details style={{marginTop:10}}><summary style={{minHeight:44,display:'flex',alignItems:'center',fontSize:14,fontWeight:800,cursor:'pointer'}}>Add it to my Android Home screen</summary><ol style={{paddingLeft:20,fontSize:14,lineHeight:1.7}}><li>Long-press an empty space on your Home screen.</li><li>Open Widgets and choose PlushLife.</li><li>Place the widget, then drag its edges to resize.</li></ol><p style={{fontSize:13}}>Your widget updates as you use PlushLife. Sign out clears its personal task data.</p></details>
  </section>;
}
