import { COZY_DECOR, earnedCozyDecor } from '../companion-experience.js';
import { ThemeWorldContext, ThemeScene } from './theme-world.jsx';
export function CozyCorner({ profile, busy, onSave }) {
  const companion=React.useContext(ThemeWorldContext);
  const earned=earnedCozyDecor(companion.unlockedIds);
  const hidden=profile.room_hidden || [];
  const visible=new Set(earned.filter(item=>!hidden.includes(item.id)).map(item=>item.id));
  return <details className="pl-cozy-corner"><summary>Your cozy corner · {earned.length}/{COZY_DECOR.length} keepsakes</summary><p>A little space that grows with your care. Everything earned stays yours.</p>
    <div className="pl-cozy-room" aria-label={`${profile.pet_name || 'Your plush'}’s cozy corner`}>
      <div className="pl-room-wall" aria-hidden="true" />
      {visible.has('plant') && <svg className="pl-room-plant" viewBox="0 0 60 90" aria-label="Earned little plant" role="img"><path d="M30 65V20M30 45Q2 40 8 15Q30 13 30 45M30 32Q57 30 54 6Q32 4 30 32" fill="#94CDB3" stroke="#448E72" strokeWidth="2"/><path d="M10 59H50L44 87H16Z" fill="#DAB4D8" stroke="#99699E" strokeWidth="2"/></svg>}
      <ThemeScene focus decorative />
      {visible.has('cushion') && <svg className="pl-room-cushion" viewBox="0 0 90 45" aria-label="Earned cozy cushion" role="img"><path d="M7 6Q45 1 83 6Q89 22 83 38Q45 43 7 38Q1 22 7 6Z" fill="#F5C9C0" stroke="#C792A8" strokeWidth="2"/><path d="M15 14Q45 9 75 14" fill="none" stroke="#FFE7DB" strokeWidth="2"/></svg>}
      {visible.has('keepsake') && <svg className="pl-room-shelf" viewBox="0 0 80 60" aria-label="Earned keepsake shelf" role="img"><path d="M4 54H76" stroke="#C79AB7" strokeWidth="6"/><rect x="18" y="7" width="35" height="43" rx="5" fill="#FFF6DF" stroke="#AE85B7" strokeWidth="3"/><path d="M35 18L38 27L48 27L40 33L43 42L35 36L27 42L30 33L22 27L32 27Z" fill="#EABD61"/></svg>}
    </div>
    <div className="pl-room-items">{COZY_DECOR.map(item=>earned.some(e=>e.id===item.id)?<label key={item.id}><input type="checkbox" checked={!hidden.includes(item.id)} disabled={busy} onChange={e=>onSave({...profile,room_hidden:e.target.checked?hidden.filter(id=>id!==item.id):[...hidden,item.id]})}/>{item.name} · earned</label>:<small key={item.id}>{item.name} · {item.hint}</small>)}</div>
  </details>;
}
