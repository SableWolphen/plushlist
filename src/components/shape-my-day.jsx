// "Shape my day" — proactive energy-aware planning.
//
// The daily check-in already captures capacity, but until now almost nothing
// proactive happened with it. On low-capacity days this card appears at the
// top of Home with a kind, time-boxed version of today built from the
// task's own metadata (essential_on_low_capacity + estimated_minutes).
// Session-only: it never rewrites the user's list, it just offers a
// smaller plan. Dismissal is remembered per date.
const SHAPE_DAY_STORAGE_KEY = "plushlife:shape-my-day:v1";
const SHAPE_DAY_TARGET_MINUTES = 30;
const SHAPE_DAY_MAX_ITEMS = 6;

function readShapeDayState() {
  try { return JSON.parse(window.localStorage.getItem(SHAPE_DAY_STORAGE_KEY) || "{}") || {}; }
  catch (_error) { return {}; }
}

function startFocusTimer() {
  window.dispatchEvent(new CustomEvent("plushlife:start-focus-timer"));
}

export function ShapeMyDay({ rows, viewDone, toggle, dailyCheckIn, period }) {
  const date = period?.date;
  const [dismissed, setDismissed] = React.useState(false);

  React.useEffect(() => {
    setDismissed(readShapeDayState().dismissedDate === date);
  }, [date]);

  const capacity = dailyCheckIn?.capacity;
  const dayType = dailyCheckIn?.day_type;
  const isLowEnergy = capacity === "low" || capacity === "very_low" || dayType === "soft" || dayType === "tiny";

  const plan = React.useMemo(() => {
    const open = (rows || []).filter((row) => row && !row.isBonus && !viewDone?.[row.key]);
    if (!open.length) return null;
    const minutesOf = (row) => Number(row.sourceTask?.estimated_minutes) || 0;
    const essentials = open.filter((row) => row.sourceTask?.essential_on_low_capacity);
    const rest = open
      .filter((row) => !row.sourceTask?.essential_on_low_capacity)
      .sort((a, b) => (minutesOf(a) || 9999) - (minutesOf(b) || 9999));
    const picked = [...essentials];
    let minutes = essentials.reduce((sum, row) => sum + minutesOf(row), 0);
    for (const row of rest) {
      if (picked.length >= SHAPE_DAY_MAX_ITEMS) break;
      const m = minutesOf(row);
      if (minutes + m <= SHAPE_DAY_TARGET_MINUTES || picked.length < 3) {
        picked.push(row);
        minutes += m;
      }
      if (minutes >= SHAPE_DAY_TARGET_MINUTES && picked.length >= 3) break;
    }
    if (!picked.length) return null;
    return { items: picked, minutes, total: open.length };
  }, [rows, viewDone]);

  if (!isLowEnergy || dayType === "rest" || dismissed || !plan) return null;

  const dismiss = () => {
    try { window.localStorage.setItem(SHAPE_DAY_STORAGE_KEY, JSON.stringify({ dismissedDate: date })); }
    catch (_error) {}
    setDismissed(true);
  };

  const timeLabel = plan.minutes > 0 ? `about ${plan.minutes} minutes` : "a few gentle minutes";

  return (
    <section aria-label="A kinder version of today" style={{ borderRadius: 22, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface)", boxShadow: "0 8px 26px rgba(101,63,115,.06)", padding: "15px 17px 14px", marginBottom: 12 }}>
      <div style={{ fontSize: 12, letterSpacing: ".13em", fontWeight: 950, color: "var(--pl-theme-muted,#B44CC7)" }}>✦&nbsp;SHAPED FOR YOUR ENERGY</div>
      <div style={{ marginTop: 6, fontSize: 17, fontWeight: 950, color: "var(--pl-theme-ink,#3E2458)", letterSpacing: "-.25px" }}>A kinder version of today</div>
      <p style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.5, color: "var(--pl-theme-ink,#6B5A7D)" }}>
        Your energy is low, so here&rsquo;s a {plan.items.length}-item plan — {timeLabel}.
        The other {Math.max(0, plan.total - plan.items.length)} can wait. Nothing is erased.
      </p>
      <div style={{ display: "grid", gap: 7, marginTop: 11 }}>
        {plan.items.map((row) => {
          const done = !!viewDone?.[row.key];
          const mins = Number(row.sourceTask?.estimated_minutes) || 0;
          return (
            <button
              key={row.key}
              type="button"
              onClick={() => toggle?.(row.key)}
              aria-pressed={done}
              style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", minHeight: 44, padding: "8px 10px", borderRadius: 14, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: done ? "#F3EAF9" : "rgba(255,255,255,.85)", cursor: "pointer" }}
            >
              <span aria-hidden="true" style={{ width: 24, height: 24, borderRadius: 8, border: "2px solid var(--pl-theme-line,#E9DDF6)", background: done ? "#B94DD2" : "white", color: "white", display: "grid", placeItems: "center", fontSize: 14, fontWeight: 900, flex: "0 0 auto" }}>{done ? "✓" : ""}</span>
              <span style={{ flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: 750, color: done ? "#9A86A7" : "#49385A", textDecoration: done ? "line-through" : "none" }}>{row.label}</span>
              {mins > 0 && <span style={{ fontSize: 11, color: "var(--pl-theme-muted,#9A86A7)", fontWeight: 800, whiteSpace: "nowrap" }}>{mins}m</span>}
              {row.sourceTask?.essential_on_low_capacity && <span style={{ fontSize: 10, fontWeight: 900, color: "var(--pl-theme-muted,#B44CC7)", whiteSpace: "nowrap" }}>♥ essential</span>}
            </button>
          );
        })}
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
        <button type="button" onClick={startFocusTimer} style={{ flex: 1, minWidth: 150, minHeight: 44, padding: "9px 13px", borderRadius: 14, border: 0, background: "var(--pl-theme-accent)", color: "white", fontWeight: 900, fontSize: 13, cursor: "pointer" }}>⏱&nbsp; Start a gentle timer</button>
        <button type="button" onClick={dismiss} style={{ minHeight: 44, padding: "9px 13px", borderRadius: 14, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface)", color: "var(--pl-theme-muted,#8B6797)", fontWeight: 800, fontSize: 13, cursor: "pointer" }}>Not today</button>
      </div>
    </section>
  );
}
