const COMPLETED_LINGER_MS = 4200;
const COMPLETION_EVENT = "plushlife:task-completion-feedback";
const RATING_PROMPT_KEY = "plushlife:rating-prompt:v1";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.PlushLife";

function giveCompletionFeedback(label, completed) {
  try {
    if (navigator?.vibrate) navigator.vibrate(completed ? [28, 28, 42] : 24);
  } catch (_error) {}
  try {
    window.dispatchEvent(new CustomEvent(COMPLETION_EVENT, {
      detail: { label, completed, at: Date.now() },
    }));
  } catch (_error) {}
}

function readRatingPromptState() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RATING_PROMPT_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_error) {
    return {};
  }
}

function RatingMoment({ completedCount = 0 }) {
  const [state, setState] = React.useState(readRatingPromptState);
  const now = Date.now();
  const dismissedUntil = Number(state.dismissedUntil || 0);
  const eligible = completedCount >= 3 && !state.rated && (!dismissedUntil || dismissedUntil <= now);
  if (!eligible) return null;

  const save = (next) => {
    setState(next);
    try { window.localStorage.setItem(RATING_PROMPT_KEY, JSON.stringify(next)); } catch (_error) {}
  };
  const rate = () => {
    save({ rated: true, ratedAt: new Date().toISOString() });
    try { window.open(PLAY_STORE_URL, "_blank", "noopener,noreferrer"); }
    catch (_error) { window.location.href = PLAY_STORE_URL; }
  };
  const later = () => save({ ...state, dismissedUntil: now + (30 * 24 * 60 * 60 * 1000) });

  return (
    <div role="region" aria-label="Rate PlushLife" style={{ marginTop: 10, padding: "10px 11px", borderRadius: 12, border: "1px solid #D9E8E2", background: "linear-gradient(145deg,#F5FCF9,#FFF9FD)" }}>
      <div style={{ fontSize: 11.5, fontWeight: 900, color: "#4D8174" }}>💜 Nice work today</div>
      <div style={{ marginTop: 3, fontSize: 10.8, lineHeight: 1.4, color: "#71857F" }}>If PlushLife has been useful, a quick Play Store rating helps other people find it too.</div>
      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={rate} style={{ minHeight: 44, padding: "8px 11px", borderRadius: 10, border: 0, background: "#4D8174", color: "white", fontWeight: 900, cursor: "pointer" }}>★ Rate PlushLife</button>
        <button type="button" onClick={later} style={{ minHeight: 44, padding: "8px 11px", borderRadius: 10, border: "1px solid #D7E8E3", background: "white", color: "#71857F", fontWeight: 800, cursor: "pointer" }}>Maybe later</button>
      </div>
    </div>
  );
}

export function useCompletedTaskFlow(toggle, viewDone = {}, rows = []) {
  const [lingerKeys, setLingerKeys] = React.useState([]);
  const [announcement, setAnnouncement] = React.useState("");
  const timersRef = React.useRef(new Map());

  React.useEffect(() => () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current.clear();
  }, []);

  const unifiedToggle = React.useCallback((key, ...args) => {
    const wasDone = !!viewDone?.[key];
    const label = rows.find((row) => row.key === key)?.label || "Task";
    const oldTimer = timersRef.current.get(key);
    if (oldTimer) window.clearTimeout(oldTimer);

    if (wasDone) {
      setLingerKeys((keys) => keys.filter((item) => item !== key));
      timersRef.current.delete(key);
      setAnnouncement(`${label} marked incomplete.`);
      giveCompletionFeedback(label, false);
    } else {
      setLingerKeys((keys) => keys.includes(key) ? keys : [...keys, key]);
      setAnnouncement(`${label} completed. Undo is available for a few seconds.`);
      giveCompletionFeedback(label, true);
      const timer = window.setTimeout(() => {
        setLingerKeys((keys) => keys.filter((item) => item !== key));
        timersRef.current.delete(key);
        setAnnouncement(`${label} moved to Completed Today.`);
      }, COMPLETED_LINGER_MS);
      timersRef.current.set(key, timer);
    }

    return toggle?.(key, ...args);
  }, [toggle, viewDone, rows]);

  return { unifiedToggle, lingerKeys, announcement };
}

export function CompletedTaskArea({ rows = [], viewDone = {}, lingerKeys = [], toggle, title = "Completed today", compact = false }) {
  const lingering = new Set(lingerKeys || []);
  const completed = rows.filter((row) => !row.isBonus && !!viewDone?.[row.key] && !lingering.has(row.key));
  if (!completed.length) return null;

  return (
    <section aria-label={title} style={{ marginTop: compact ? 8 : 12, padding: compact ? 10 : 12, borderRadius: 14, border: "1px solid #E4D9E9", background: "rgba(255,255,255,.72)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ fontSize: 10.5, letterSpacing: ".11em", fontWeight: 900, color: "#8D7898" }}>✓ {title.toUpperCase()}</div>
        <div style={{ fontSize: 9.5, color: "#A08EAA" }}>Tap any item to undo</div>
      </div>
      <div style={{ display: "grid", gap: 6, marginTop: 8 }}>
        {completed.map((task) => (
          <button key={task.key} type="button" onClick={() => toggle?.(task.key)} aria-label={`Undo completion for ${task.label}`} style={{ minHeight: 44, display: "grid", gridTemplateColumns: "24px minmax(0,1fr) auto", gap: 8, alignItems: "center", padding: compact ? "8px 9px" : "9px 10px", borderRadius: 11, border: "1px solid #E7DDEB", background: "#FCF9FD", color: "#927F9C", textAlign: "left", cursor: "pointer" }}>
            <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: "50%", background: "#9B78AA", color: "white", display: "grid", placeItems: "center", fontWeight: 900 }}>✓</span>
            <span style={{ minWidth: 0, fontSize: 12.5, lineHeight: 1.35, fontWeight: 800, textDecoration: "line-through", overflow: "hidden", textOverflow: "ellipsis" }}>{task.label}</span>
            <span aria-hidden="true" style={{ fontSize: 10.5, fontWeight: 900, color: "#8D7898" }}>Undo</span>
          </button>
        ))}
      </div>
      <RatingMoment completedCount={completed.length} />
    </section>
  );
}

export const COMPLETED_TASK_LINGER_MS = COMPLETED_LINGER_MS;
export const TASK_COMPLETION_FEEDBACK_EVENT = COMPLETION_EVENT;
