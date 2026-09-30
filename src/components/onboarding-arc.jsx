// A 7-day gentle onboarding arc (progressive disclosure).
//
// Day-1 onboarding is decent, but days 2–7 used to drop users into the whole
// app at once. This card shows one small, dismissible nudge per day —
// pointing at features that already exist — so the first week feels guided
// instead of overwhelming. Pure localStorage; no schema changes.
const ARC_STORAGE_KEY = "plushlife:onboarding-arc:v1";

const ARC_NUDGES = [
  null, // day 1 is covered by onboarding itself
  {
    day: 2, emoji: "🧸", title: "Make room for one comfort",
    body: "My Cozy Space is there when you want it. Add a favorite blanket, sound, or snack — there’s no setup checklist.", destination: "care",
  },
  {
    day: 3, emoji: "🌱", title: "Too much? Make it smaller",
    body: "On any task you can ask for a tinier version. Smaller still counts — quitting quietly doesn\u2019t have to be the option.",
  },
  {
    day: 4, emoji: "📊", title: "Progress isn\u2019t a grade",
    body: "Peek at the Progress tab sometime. It notices patterns and celebrates care days — it never scolds.",
  },
  {
    day: 5, emoji: "💗", title: "Overwhelmed? There\u2019s a button for that",
    body: "The Care tab has comfort tools and \u201CHelp me now\u201D for hard moments: anxious, can\u2019t start, can\u2019t sleep, lonely.",
  },
  {
    day: 6, emoji: "📝", title: "One line at night",
    body: "The journal keeps one private line a day. Future-you will love reading how far you\u2019ve come.",
  },
  {
    day: 7, emoji: "🌷", title: "A week of showing up",
    body: "Seven days of being here for yourself. Set next week\u2019s intention — tiny is a perfectly good size.",
  },
];

function readArcState() {
  try { return JSON.parse(window.localStorage.getItem(ARC_STORAGE_KEY) || "{}") || {}; }
  catch (_error) { return {}; }
}

function writeArcState(patch) {
  try { window.localStorage.setItem(ARC_STORAGE_KEY, JSON.stringify({ ...readArcState(), ...patch })); }
  catch (_error) {}
}

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function daysBetween(a, b) {
  const ms = new Date(`${b}T12:00:00Z`) - new Date(`${a}T12:00:00Z`);
  return Math.round(ms / 86400000);
}

export function OnboardingArc({ onboardingComplete, goToDashboard }) {
  const [dayIndex, setDayIndex] = React.useState(0);
  const [dismissed, setDismissed] = React.useState(false);
  const today = localDateKey();

  React.useEffect(() => {
    if (!onboardingComplete) return;
    const state = readArcState();
    if (!state.startDate) writeArcState({ startDate: today, dismissedDays: [] });
    const start = state.startDate || today;
    setDayIndex(daysBetween(start, today) + 1);
    setDismissed(Array.isArray(state.dismissedDays) && state.dismissedDays.includes(today));
  }, [onboardingComplete, today]);

  if (!onboardingComplete || dayIndex < 2 || dayIndex > 7 || dismissed) return null;
  const nudge = ARC_NUDGES.find(item => item?.day === dayIndex);
  if (!nudge) return null;

  const dismiss = () => {
    const state = readArcState();
    writeArcState({ dismissedDays: Array.from(new Set([...(state.dismissedDays || []), today])) });
    setDismissed(true);
  };

  return (
    <section aria-label={`Day ${dayIndex} of your first week`} style={{ borderRadius: 20, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface)", boxShadow: "0 8px 22px rgba(101,63,115,.05)", padding: "13px 15px", marginBottom: 12 }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 11 }}>
        <span aria-hidden="true" style={{ fontSize: 30, lineHeight: 1.1 }}>{nudge.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10.5, letterSpacing: ".12em", fontWeight: 950, color: "var(--pl-theme-muted,#B44CC7)" }}>WHEN YOU FEEL READY</div>
          <div style={{ marginTop: 3, fontSize: 14.5, fontWeight: 950, color: "var(--pl-theme-ink,#3E2458)" }}>{nudge.title}</div>
          <p style={{ margin: "4px 0 0", fontSize: 12.5, lineHeight: 1.5, color: "var(--pl-theme-ink,#6B5A7D)" }}>{nudge.body}</p>
        </div>
        <button type="button" onClick={dismiss} aria-label="Dismiss for today" style={{ border: 0, background: "transparent", color: "var(--pl-theme-muted,#B79DC4)", fontSize: 18, cursor: "pointer", padding: 4, lineHeight: 1 }}>×</button>
      </div>
      <button type="button" onClick={()=>{if(nudge.destination==='care')window.__plushlifeOpenCozySpace=true;goToDashboard?.(nudge.destination || (dayIndex===7?'progress':'care'));dismiss();}} style={{minHeight:44,marginTop:8,padding:'8px 12px',borderRadius:14,border:'1px solid var(--pl-theme-line)',background:'var(--pl-theme-surface-2)',color:'var(--pl-theme-ink)',font:'inherit'}}>Explore when I’m ready</button>
    </section>
  );
}
