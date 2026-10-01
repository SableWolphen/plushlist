import { PLUSH_GOLD_BILLING_ENABLED, PLUSH_GOLD_FEATURES } from '../plush-gold.js';
import { ThemeScene } from './theme-world.jsx';
import { HabitStudio } from './habit-studio.jsx';
const free=['Your tasks, habits, calendar, and basic goals','Care tools, comfort items, and Guardian boundaries','Reminders, accessibility, privacy, and task backup','A gentle return after breaks, with no lost progress'];
const tools=[{id:'together',icon:'🧸',title:'Routine Builder',text:'Arrange a few caring steps and do them with your plush, one at a time.'},{id:'try',icon:'🌱',title:'Habit experiments',text:'Try one change for seven days and compare your real observed progress.'},{id:'week',icon:'🌷',title:'A little weekly review',text:'See what fitted your week and choose one kind adjustment.'}];
export function PlushGoldPreview(){
  const [cycle,setCycle]=React.useState('yearly');
  const [preview,setPreview]=React.useState('');
  return <section className="pl-plus-page" aria-label="PlushLife Plus plan">
    <header className="pl-plus-hero"><div className="pl-plus-hero-copy"><span className="pl-studio-eyebrow">A little more help, a little less effort</span><h2>PlushLife <em>Plus</em></h2><p>Thoughtful tools for building routines that feel like yours.</p><span className="pl-plus-preview-badge">Included free while we build Plus</span></div><ThemeScene focus decorative/></header>
    <div className="pl-plus-tools">{tools.map(tool=><article className="pl-plus-tool" key={tool.id}><span className="pl-plus-tool-icon" aria-hidden="true">{tool.icon}</span><h3>{tool.title}</h3><p>{tool.text}</p><button type="button" onClick={()=>setPreview(preview===tool.id?'':tool.id)} aria-expanded={preview===tool.id}>{preview===tool.id?'Close this preview':'Try it with my habits'} <span aria-hidden="true">→</span></button></article>)}</div>
    {preview&&<div className="pl-plus-live-preview"><HabitStudio key={preview} initialTab={preview}/></div>}
    <section className="pl-plus-plan"><span className="pl-studio-eyebrow">The future subscription</span><h3>One optional plan. More room to grow.</h3><div className="pl-plus-cycle" role="group" aria-label="Future subscription billing cycle">{[['monthly','Monthly'],['yearly','Yearly']].map(([value,label])=><button type="button" key={value} aria-pressed={cycle===value} onClick={()=>setCycle(value)}>{label}<small>{value==='monthly'?'A month at a time':'A year of gentle routines'}</small></button>)}</div><p className="pl-plus-price">Pricing will be shown when subscriptions open.</p><button type="button" className="pl-plus-purchase" disabled>Purchases aren’t open yet</button><p role="status" className="pl-studio-muted">{PLUSH_GOLD_BILLING_ENABLED?'Billing is enabled.':'No purchase or subscription starts from this preview. Everything remains unlocked.'}</p></section>
    <section className="pl-plus-free"><h3>Free stays a complete little home</h3><ul>{free.map(text=><li key={text}><span aria-hidden="true">✓</span>{text}</li>)}</ul><p>Your comfort, essential support, privacy, themes, and plush accessories stay outside paid upgrades.</p></section>
    <details className="pl-plus-roadmap"><summary>What’s next for Plus?</summary><p>We’re preparing longer personal reports, more routine planning options, and goals that travel between devices. These are future additions, not features you’re being charged for today.</p></details>
    <footer className="pl-plus-footer">Comfort stays yours. Plus adds useful help, at your pace.</footer>
  </section>;
}
export {PLUSH_GOLD_FEATURES};
