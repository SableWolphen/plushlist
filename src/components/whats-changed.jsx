import { CHANGELOG_ITEMS, PREVIOUS_CHANGELOG_ITEMS } from "../release-notes.mjs";

export function WhatsChanged({ unread, onMarkRead, onClose }) {
  const [saving, setSaving] = React.useState(false);
  const [message, setMessage] = React.useState("");
  return <section className="pl-calm-updates pl-calm-page" aria-labelledby="pl-whats-changed-title" tabIndex={-1}>
    <header className="pl-calm-page-heading"><div><span className="pl-calm-eyebrow">What changed</span><h1 id="pl-whats-changed-title">A few lovely little updates</h1><p>Catch up here whenever you’re ready.</p></div><button type="button" onClick={onClose} aria-label="Close What changed">Back</button></header>
    <article className="pl-calm-update"><span className="pl-calm-eyebrow">A calmer little space</span><h2>More space. Fewer interruptions.</h2><ul>{CHANGELOG_ITEMS.map(item=><li key={item}>{item}</li>)}</ul></article>
    <details className="pl-calm-update-history"><summary>Earlier updates</summary><ul>{PREVIOUS_CHANGELOG_ITEMS.map(item=><li key={item}>{item}</li>)}</ul></details>
    {unread && <button type="button" className="pl-calm-primary" disabled={saving} onClick={async()=>{setSaving(true);try{const okay=await onMarkRead();setMessage(okay===false?"Could not confirm this change. Try again when connected.":"All caught up. New updates will appear here.");}catch{setMessage("Could not confirm this change. Try again when connected.");}finally{setSaving(false);}}}>{saving?"Saving…":"Mark as read"}</button>}
    <p className="pl-calm-save-status" role="status" aria-live="polite">{message}</p>
  </section>;
}
