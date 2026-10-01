import { PLUSH_GOLD_BILLING_ENABLED, PLUSH_GOLD_FEATURES } from '../plush-gold.js';
import { ThemeScene } from './theme-world.jsx';
import { HabitStudio } from './habit-studio.jsx';
const tools=[
  {id:'together',icon:'🧸',title:'Build a routine',text:'Put your steps in order. Do them together.'},
  {id:'try',icon:'🌱',title:'Find what works',text:'Try one change for seven days.'},
  {id:'week',icon:'🌷',title:'Understand your week',text:'See your progress. Pick one adjustment.'},
];
export function PlushGoldPreview(){
  const [preview,setPreview]=React.useState('');
  const tool=tools.find(item=>item.id===preview);
  return <section className="pl-plus-page pl-plus-simple" aria-label="PlushLife Plus plan">
    <header className="pl-plus-hero"><div className="pl-plus-hero-copy"><h2>PlushLife <em>Plus</em></h2><p>A little help with planning and progress.</p><span className="pl-plus-preview-badge">Free preview · no subscription</span></div><ThemeScene focus decorative/></header>
    {tool?<><button type="button" className="pl-plus-back" onClick={()=>setPreview('')}>← Back to Plus</button><h3 className="pl-plus-preview-title">{tool.title}</h3><HabitStudio key={preview} initialTab={preview}/></>:<>
      <section className="pl-plus-benefits" aria-label="What you get"><h3>Three ways to make habits easier</h3><div className="pl-plus-tool-list">{tools.map(item=><button type="button" className="pl-plus-tool-row" key={item.id} onClick={()=>setPreview(item.id)} aria-label={`Try ${item.title.toLowerCase()}`}><span className="pl-plus-tool-icon" aria-hidden="true">{item.icon}</span><span><strong>{item.title}</strong><small>{item.text}</small></span><span aria-hidden="true">›</span></button>)}</div><p className="pl-studio-muted">Tap a tool to try it with your habits.</p></section>
      <div className="pl-plus-availability"><button type="button" className="pl-plus-purchase" disabled>Purchases aren’t open yet</button><p role="status">{PLUSH_GOLD_BILLING_ENABLED?'Billing is enabled.':'Everything remains unlocked. No payment needed.'}</p></div>
      <details className="pl-plus-free"><summary>What stays free?</summary><p>Everyday tasks and habits, calendar, reminders, care tools, Guardian support, privacy, and backups.</p><p>Themes and plush rewards stay free too.</p></details>
      <details className="pl-plus-roadmap"><summary>What’s planned for the paid version?</summary><p>Optional monthly or yearly subscriptions, longer progress reports, and more planning options. Pricing and the exact paid features will be shown before subscriptions open.</p><p>These are planned additions. You are not being charged for them today.</p></details>
    </>}
  </section>;
}
export {PLUSH_GOLD_FEATURES};
