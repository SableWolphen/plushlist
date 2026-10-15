// Cozy-owned suggestions. Stored locally per account; never shared with a Guardian automatically.
const IDEAS = ["Movie night", "Story time", "Coloring", "A cozy evening", "Plush cuddle time", "A favorite game", "A relaxing walk", "A creative afternoon"];
const storageKey = (userId) => `plushlife:cozy-reward-wishlist:${userId}`;
function readWishlist(userId) {
  if (!userId || typeof window === "undefined") return [];
  try {
    const data = JSON.parse(window.localStorage.getItem(storageKey(userId)) || "[]");
    return Array.isArray(data) ? data.filter(item => typeof item === "string").slice(0, 30) : [];
  } catch { return []; }
}
export function CozyRewardWishlist({ userId }) {
  const [wishlist, setWishlist] = React.useState([]);
  const [draft, setDraft] = React.useState("");
  const [suggestion, setSuggestion] = React.useState("");
  const [notice, setNotice] = React.useState("");
  React.useEffect(() => {
    setWishlist(readWishlist(userId));
    setDraft("");
    setSuggestion("");
    setNotice("");
  }, [userId]);
  function save(next) {
    if (!userId) return;
    try {
      window.localStorage.setItem(storageKey(userId), JSON.stringify(next));
      setWishlist(next);
      setNotice("Saved on this device. Nothing was shared.");
    } catch {
      setNotice("Couldn't save your wishlist on this device.");
    }
  }
  const add = () => {
    const name = draft.trim().slice(0, 80);
    if (!name || wishlist.some(item => item.toLowerCase() === name.toLowerCase()) || wishlist.length >= 30) return;
    save([...wishlist, name]);
    setDraft("");
  };
  return <section className="pl-cozy-reward-wishlist" aria-label="My reward wishlist" style={{padding:15,borderRadius:16,background:"var(--pl-theme-surface)",border:"1px solid var(--pl-theme-line)",color:"var(--pl-theme-ink)",display:"grid",gap:10}}>
    <h2 style={{margin:0,fontSize:17}}>💝 My reward wishlist</h2>
    <p style={{margin:0,fontSize:13,color:"var(--pl-theme-muted)"}}>You choose activities you'd enjoy. This private list stays on this device and is not sent to your Guardian. Suggestions aren't earned rewards.</p>
    <div style={{display:"flex",gap:7,flexWrap:"wrap"}}>
      <input aria-label="Add an activity to my wishlist" value={draft} maxLength={80} placeholder="Something I would enjoy…" onChange={event=>setDraft(event.target.value)} onKeyDown={event=>{if(event.key==="Enter"){event.preventDefault();add();}}} style={{flex:"1 1 170px",minWidth:0,padding:10,borderRadius:10,border:"1px solid var(--pl-theme-line)",background:"var(--pl-theme-surface-2)",color:"var(--pl-theme-ink)"}}/>
      <button type="button" disabled={!draft.trim() || wishlist.length>=30} onClick={add} style={{minHeight:44,padding:"8px 12px",borderRadius:10}}>Add idea</button>
    </div>
    {wishlist.length>0 && <ul style={{margin:0,paddingLeft:20}}>{wishlist.map(item=><li key={item} style={{marginBottom:7}}><span>{item}</span> <button type="button" onClick={()=>save(wishlist.filter(value=>value!==item))} aria-label={`Remove ${item} from wishlist`} style={{minHeight:36,marginLeft:6}}>Remove</button></li>)}</ul>}
    <button type="button" onClick={()=>{const pool=wishlist.length?wishlist:IDEAS;setSuggestion(pool[Math.floor(Math.random()*pool.length)]);}} style={{minHeight:44,borderRadius:12}}>✨ Suggest a cozy surprise</button>
    {suggestion && <p role="status" style={{margin:0,fontSize:14}}>How about <strong>{suggestion}</strong>? Your choice — skip it or enjoy it whenever you like. This does not redeem a reward.</p>}
    {notice && <p role="status" style={{margin:0,fontSize:12,color:"var(--pl-theme-muted)"}}>{notice}</p>}
  </section>;
}
