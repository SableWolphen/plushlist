// One required field; scheduling and habit direction are optional.
export function QuickCapture({ compact = false, habit = false, onQuickAdd, quickAddMessage }) {
  const [text, setText] = React.useState("");
  const [when, setWhen] = React.useState("today");
  const [repeat, setRepeat] = React.useState(habit ? "daily" : "once");
  const [kind, setKind] = React.useState(habit ? "build" : "regular");
  const [busy, setBusy] = React.useState(false);
  const [justAdded, setJustAdded] = React.useState("");
  const [error, setError] = React.useState("");
  const add = async () => {
    const name = text.trim();
    if (!name || busy) return;
    setBusy(true);
    setError("");
    try {
      const ok = await onQuickAdd?.(name, repeat === "once" ? when : "today", { kind, repeat });
      if (ok) { setText(""); setJustAdded(name); }
    } catch (_error) { setJustAdded(""); setError("Couldn't save. Your name is still here; please try again."); }
    finally { setBusy(false); }
  };
  return (
    <div className={compact ? "pl-quick-capture-compact" : "pl-quick-capture"} style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
        <input value={text} onChange={event => { setText(event.target.value); setJustAdded(""); }}
          onKeyDown={event => { if (event.key === "Enter") { event.preventDefault(); add(); } }}
          maxLength={240} placeholder={habit ? "e.g. Drink a glass of water" : "What needs doing?"}
          aria-label={habit ? "Quickly add a habit" : "Quickly add a task"}
          style={{ flex: 1, minWidth: 0, padding: "11px 12px", borderRadius: 12, border: "1px solid var(--pl-theme-line,#E9DDF6)", fontSize: 16 }} />
        <button type="button" onClick={add} disabled={busy || !text.trim()} style={{ padding: "0 18px", minHeight: 46, borderRadius: 12, border: 0, background: "var(--pl-theme-accent,#A65DC1)", color: "white", fontWeight: 900, fontSize: 14 }}>
          {busy ? "Saving…" : "Add"}
        </button>
      </div>
      {!compact && <>
        <details style={{ marginTop: 8 }}>
          <summary style={{ minHeight: 44, cursor: "pointer", alignContent: "center", fontSize: 13 }}>{repeat === "daily" ? "Every day" : repeat === "weekdays" ? "Weekdays" : when === "tomorrow" ? "Tomorrow" : when === "someday" ? "Someday" : "Today"} · Change schedule{habit ? " or habit type" : ""}</summary>
          <div style={{ display: "grid", gap: 10, padding: "8px 0" }}>
            <label>Repeat <select aria-label="Quick add repeat" value={repeat} onChange={event => setRepeat(event.target.value)}>
              {!habit && <option value="once">Just once</option>}<option value="daily">Every day</option><option value="weekdays">Weekdays</option>
            </select></label>
            {repeat === "once" && <label>When <select aria-label="Quick add day" value={when} onChange={event => setWhen(event.target.value)}><option value="today">Today</option><option value="tomorrow">Tomorrow</option><option value="someday">Someday</option></select></label>}
            {habit && <label>Habit type <select aria-label="Quick add habit type" value={kind} onChange={event => setKind(event.target.value)}><option value="build">Build a habit</option><option value="reduce">Cut back on a habit</option></select></label>}
          </div>
        </details>
      </>}
      {(justAdded || quickAddMessage) && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 13 }}>{justAdded ? `Added “${justAdded}” ✓` : quickAddMessage}</div>}
      {error && <div role="alert">{error}</div>}
    </div>
  );
}
