// Quick capture — a lightweight brain-dump bar at the top of Add & organize.
//
// Tapping Add used to open the full task manager (sections, schedules,
// reminders, labels) — a wall for an anxious user with one buzzing thought.
// This is one text field + Today / Tomorrow / Someday chips with smart
// defaults. "More options" scrolls to the full form below.
const QUICK_WHEN_OPTIONS = [
  { id: "today", label: "Today", emoji: "☀️" },
  { id: "tomorrow", label: "Tomorrow", emoji: "🌤️" },
  { id: "someday", label: "Someday", emoji: "🌙" },
];

export function QuickCapture({ onQuickAdd, quickAddMessage, onMoreOptions }) {
  const [text, setText] = React.useState("");
  const [when, setWhen] = React.useState("today");
  const [busy, setBusy] = React.useState(false);
  const [justAdded, setJustAdded] = React.useState("");

  const add = async () => {
    const name = text.trim();
    if (!name || busy) return;
    setBusy(true);
    try {
      const ok = await onQuickAdd?.(name, when);
      if (ok) {
        setText("");
        setJustAdded(name);
        window.setTimeout(() => setJustAdded(""), 4000);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ marginBottom: 14, padding: 16, borderRadius: 18, background: "var(--pl-theme-surface)", border: "1px solid var(--pl-theme-line,#E9DDF6)", boxShadow: "0 8px 22px rgba(103,65,122,.06)" }}>
      <div style={{ fontSize: 13, fontWeight: 900, color: "var(--pl-theme-ink,#8A6A21)" }}>⚡ QUICK ADD</div>
      <div style={{ marginTop: 4, fontSize: 11.5, lineHeight: 1.45, color: "var(--pl-theme-muted,#7B6888)" }}>Got a thought buzzing? Park it here in seconds — no forms, no decisions.</div>
      <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
        <input
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); add(); } }}
          maxLength={240}
          placeholder="e.g. Remember the dentist"
          aria-label="Quickly add a task"
          style={{ flex: 1, minWidth: 0, padding: "11px 12px", borderRadius: 12, border: "1px solid var(--pl-theme-line,#E9DDF6)", fontSize: 14 }}
        />
        <button type="button" onClick={add} disabled={busy || !text.trim()} style={{ padding: "0 18px", minHeight: 46, borderRadius: 12, border: 0, background: !text.trim() ? "#D9CBE2" : "linear-gradient(135deg,#B95DCA,#DB78BF)", color: "white", fontWeight: 900, fontSize: 14, cursor: !text.trim() ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
          {busy ? "…" : "Add ✨"}
        </button>
      </div>
      <div style={{ display: "flex", gap: 7, marginTop: 9, flexWrap: "wrap" }} role="group" aria-label="When should this happen">
        {QUICK_WHEN_OPTIONS.map((option) => {
          const selected = when === option.id;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={selected}
              onClick={() => setWhen(option.id)}
              style={{ padding: "8px 13px", minHeight: 40, borderRadius: 999, border: selected ? "2px solid #A65DC1" : "1px solid #E3C9EC", background: selected ? "#F2DEFA" : "white", color: selected ? "#7E3D99" : "#6B5A7D", fontWeight: 900, fontSize: 12.5, cursor: "pointer" }}
            >
              {option.emoji} {option.label}
            </button>
          );
        })}
        <button type="button" onClick={onMoreOptions} style={{ marginLeft: "auto", padding: "8px 6px", minHeight: 40, border: 0, background: "transparent", color: "var(--pl-theme-muted,#9A57AC)", fontWeight: 800, fontSize: 12.5, cursor: "pointer" }}>
          More options ↓
        </button>
      </div>
      {when === "someday" && (
        <div style={{ marginTop: 8, fontSize: 11.5, color: "var(--pl-theme-ink,#8A6A21)", lineHeight: 1.45 }}>🌙 Someday tasks rest quietly in your list — paused until you&rsquo;re ready. Resume one anytime from below.</div>
      )}
      {(justAdded || quickAddMessage) && (
        <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: "var(--pl-theme-ink,#318C79)" }}>
          {justAdded ? `Parked “${justAdded.length > 42 ? `${justAdded.slice(0, 42)}…` : justAdded}” ✓` : quickAddMessage}
        </div>
      )}
    </div>
  );
}
