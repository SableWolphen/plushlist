import { weeklyKeepsakeMemories } from '../companion-experience.js';
import { ThemeScene, ThemeWorldContext } from './theme-world.jsx';
const ShareKeepsake=React.lazy(()=>import('./share-win-modal.jsx').then(module=>({default:module.ShareWinModal})));
export function WeeklyKeepsake({ memories=[], petName='' }) {
  const companion=React.useContext(ThemeWorldContext);
  const moments=weeklyKeepsakeMemories(memories);
  const [selected,setSelected]=React.useState('');
  const [sharing,setSharing]=React.useState(false);
  const chosen=moments.find(item=>item.id===selected);
  // Never silently choose or publish a private memory.
  React.useEffect(()=>{if(selected && !moments.some(item=>item.id===selected)){setSelected('');setSharing(false);}},[selected,JSON.stringify(moments.map(item=>item.id))]);
  return <section className="pl-weekly-keepsake" aria-label="Weekly keepsake"><h4>This week, kept gently</h4><div className="pl-keepsake-preview"><ThemeScene focus decorative/><strong>{petName || 'Your plush'}’s little week</strong><p>{chosen?chosen.text:'A little care counts.'}</p></div>
    <label>A win to include · optional<select value={selected} onChange={e=>setSelected(e.target.value)}><option value="">Keep it just about my plush</option>{moments.map(item=><option key={item.id} value={item.id}>{item.text.slice(0,80)}</option>)}</select></label>
    <small>Only this card and the win you choose will be shared. Your comforts stay private.</small>
    <button type="button" className="pl-link-btn" onClick={()=>setSharing(true)}>Preview & share keepsake →</button>
    {sharing && <React.Suspense fallback={<p role="status">Opening your keepsake…</p>}><ShareKeepsake winText={chosen?.text || 'A little care counts.'} keepsake={{outfit:companion.outfit,petName}} onClose={()=>setSharing(false)}/></React.Suspense>}
  </section>;
}
