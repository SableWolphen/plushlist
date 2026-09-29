import { HOME_SECTIONS, normalizeHomeLayout, moveHomeSection } from "../home-layout.js";

export function HomeLayoutEditor({ value, onSave }) {
  const [draft, setDraft] = React.useState(() => normalizeHomeLayout(value));
  const [saved, setSaved] = React.useState(false);
  React.useEffect(() => { setDraft(normalizeHomeLayout(value)); }, [value]);
  const change = next => { setDraft(next); setSaved(false); };
  return <section className="pl-home-customizer" aria-label="Customize Home">
    <h3>Your Home, at your pace</h3>
    <p>Choose which cards you see and what comes first. Your tasks and progress stay yours.</p>
    <ol>
      {draft.order.map((id, index) => <li key={id}>
        <label><input type="checkbox" checked={!draft.hidden.includes(id)} onChange={event => change({ ...draft, hidden: event.target.checked ? draft.hidden.filter(item => item !== id) : [...draft.hidden, id] })} />{HOME_SECTIONS.find(section => section.id === id).label}</label>
        <button type="button" aria-label={`Move ${HOME_SECTIONS.find(section => section.id === id).label} up`} disabled={index === 0} onClick={() => change(moveHomeSection(draft, id, -1))}>↑</button>
        <button type="button" aria-label={`Move ${HOME_SECTIONS.find(section => section.id === id).label} down`} disabled={index === draft.order.length - 1} onClick={() => change(moveHomeSection(draft, id, 1))}>↓</button>
      </li>)}
    </ol>
    <div className="pl-home-customizer-actions">
      <button type="button" className="pl-design-primary" onClick={() => { onSave(draft); setSaved(true); }}>Apply to my Home</button>
      <button type="button" onClick={() => { const next = normalizeHomeLayout(); change(next); onSave(next); }}>Restore default</button>
    </div>
    {saved && <p role="status">Home updated. Your save status appears below.</p>}
  </section>;
}
