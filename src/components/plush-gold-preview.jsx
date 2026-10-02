import { PLUSH_GOLD_BILLING_ENABLED, PLUSH_GOLD_FEATURES } from '../plush-gold.js';
import { ThemeScene } from './theme-world.jsx';

const tools=[
  {id:'together',icon:'🧸',title:'Build a routine',text:'Put your steps in order. Do them together.',steps:['Pick up to 5 steps','Choose the order','Start when you’re ready']},
  {id:'try',icon:'🌱',title:'Find what works',text:'Try one change for seven days.',steps:['Choose one small change','Try it for 7 days','Keep it, change it, or drop it']},
  {id:'week',icon:'🌷',title:'Understand your week',text:'See your progress. Pick one adjustment.',steps:['See one simple weekly summary','Notice what helped','Choose one adjustment']},
];

export function PlushGoldPreview(){
  const [preview,setPreview]=React.useState('');
  const tool=tools.find(item=>item.id===preview);
  return <section className="pl-plus-page pl-plus-simple" aria-label="PlushLife Plus plan">
    <header className="pl-plus-hero">
      <div className="pl-plus-hero-copy">
        <h2>PlushLife <em>Plus</em></h2>
        <p>A little help with planning and progress.</p>
        <span className="pl-plus-preview-badge">Free preview · no subscription</span>
      </div>
      <ThemeScene focus decorative/>
    </header>

    {tool ? (
      <section className="pl-plus-benefits" aria-label={tool.title + " preview"} style={{marginTop:12}}>
        <button type="button" className="pl-plus-back" onClick={()=>setPreview('')}>← Back to Plus</button>
        <div style={{marginTop:10,padding:14,borderRadius:16,background:'var(--pl-theme-surface-2,#F4FBF8)',border:'1px solid var(--pl-theme-line,#E9DDF6)'}}>
          <div style={{fontSize:26}} aria-hidden="true">{tool.icon}</div>
          <h3 style={{margin:'6px 0 4px'}}>{tool.title}</h3>
          <p className="pl-studio-muted" style={{margin:0}}>{tool.text}</p>
          <div style={{display:'grid',gap:7,marginTop:12}}>
            {tool.steps.map((step,index)=><div key={step} style={{display:'flex',gap:8,alignItems:'center',padding:'8px 10px',borderRadius:11,background:'var(--pl-theme-surface,#FFF)',border:'1px solid var(--pl-theme-line,#E9DDF6)',fontSize:13,fontWeight:800,color:'var(--pl-theme-ink,#5B4B6B)'}}><span aria-hidden="true" style={{width:22,height:22,display:'grid',placeItems:'center',borderRadius:999,background:'var(--pl-theme-surface-2,#EEF9F6)',fontSize:11}}>{index+1}</span><span>{step}</span></div>)}
          </div>
        </div>
      </section>
    ) : (
      <>
        <section className="pl-plus-benefits" aria-label="What you get">
          <h3>Three ways to make habits easier</h3>
          <div className="pl-plus-tool-list">
            {tools.map(item=><button type="button" className="pl-plus-tool-row" key={item.id} onClick={()=>setPreview(item.id)} aria-label={"Try " + item.title.toLowerCase()}><span className="pl-plus-tool-icon" aria-hidden="true">{item.icon}</span><span><strong>{item.title}</strong><small>{item.text}</small></span><span aria-hidden="true">›</span></button>)}
          </div>
        </section>
        <div className="pl-plus-availability">
          <button type="button" className="pl-plus-purchase" disabled>Purchases aren’t open yet</button>
          <p role="status">{PLUSH_GOLD_BILLING_ENABLED?'Billing is enabled.':'Everything remains unlocked. No payment needed.'}</p>
        </div>
        <details className="pl-plus-free"><summary>What stays free?</summary><p>Everyday tasks and habits, calendar, reminders, care tools, Guardian support, privacy, backups, themes, and plush rewards.</p></details>
      </>
    )}
  </section>;
}

export {PLUSH_GOLD_FEATURES};
