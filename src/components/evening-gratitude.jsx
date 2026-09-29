// Evening "one good thing" — a living wins jar.
//
// The wins jar used to be derived passively from habit history. This card
// appears after 6pm, once a day, with one micro-prompt: "one good thing
// from today?" The answer is dispatched to the app shell, which appends it
// to today's private note (existing private_notes upsert, no migration).
// Ten seconds, positive-psychology core loop, a reason to open the app at
// night to balance the morning check-in.
const GRATITUDE_STORAGE_KEY = "plushlife:evening-gratitude:v1";
const EVENING_HOUR = 18;

// The share modal (and its canvas renderer) loads on first tap, never at
// startup — sharing is a rare action and must not cost the critical path.
const ShareWinModalLazy = React.lazy(() => import("./share-win-modal.jsx").then((module) => ({ default: module.ShareWinModal })));

function readGratitudeState() {
  try { return JSON.parse(window.localStorage.getItem(GRATITUDE_STORAGE_KEY) || "{}") || {}; }
  catch (_error) { /* silent: corrupt or missing localStorage entry — fall back to empty */ return {}; }
}

function writeGratitudeState(patch) {
  try { window.localStorage.setItem(GRATITUDE_STORAGE_KEY, JSON.stringify({ ...readGratitudeState(), ...patch })); }
  catch (_error) { /* silent: localStorage quota or access denied — gratitude still shown next session */ }
}

function localDateKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function EveningGratitude() {
  const today = localDateKey();
  const hour = new Date().getHours();
  const [text, setText] = React.useState("");
  const [saved, setSaved] = React.useState(false);
  const [hidden, setHidden] = React.useState(true);
  const [shareOpen, setShareOpen] = React.useState(false);

  React.useEffect(() => {
    const state = readGratitudeState();
    const isEvening = hour >= EVENING_HOUR;
    const already = state.savedDate === today || state.dismissedDate === today;
    setHidden(!isEvening || already);
    setSaved(state.savedDate === today);
  }, [today, hour]);

  if (hidden) return null;

  const dismiss = () => {
    writeGratitudeState({ dismissedDate: today });
    setHidden(true);
  };

  const save = () => {
    const clean = text.trim();
    if (!clean) return;
    window.dispatchEvent(new CustomEvent("plushlife:gratitude", { detail: { text: clean } }));
    writeGratitudeState({ savedDate: today });
    setSaved(true);
  };

  return (
    <section aria-label="One good thing from today" style={{ borderRadius: 20, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface)", boxShadow: "0 8px 22px rgba(101,63,115,.05)", padding: "14px 15px", marginBottom: 12 }}>
      {!saved ? (
        <>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <span aria-hidden="true" style={{ fontSize: 28, lineHeight: 1.1 }}>🌟</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10.5, letterSpacing: ".12em", fontWeight: 950, color: "var(--pl-theme-muted,#B44CC7)" }}>EVENING CHECK-IN</div>
              <div style={{ marginTop: 3, fontSize: 14.5, fontWeight: 950, color: "var(--pl-theme-ink,#3E2458)" }}>One good thing from today?</div>
              <p style={{ margin: "4px 0 0", fontSize: 12.5, lineHeight: 1.5, color: "var(--pl-theme-ink,#6B5A7D)" }}>Tiny counts. Kept privately in your journal.</p>
            </div>
            <button type="button" onClick={dismiss} aria-label="Dismiss evening check-in for today" style={{ border: 0, background: "transparent", color: "var(--pl-theme-muted,#B79DC4)", fontSize: 18, cursor: "pointer", padding: 4, lineHeight: 1 }}>×</button>
          </div>
          <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
            <input
              value={text}
              onChange={(event) => setText(event.target.value)}
              onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); save(); } }}
              maxLength={280}
              placeholder="e.g. I drank water before coffee"
              aria-label="One good thing from today"
              style={{ flex: 1, minWidth: 0, padding: "10px 12px", borderRadius: 12, border: "1px solid var(--pl-theme-line,#E9DDF6)", fontSize: 13.5 }}
            />
            <button type="button" onClick={save} disabled={!text.trim()} aria-label={text.trim() ? "Save your good thing" : "Type something first"} style={{ padding: "0 16px", minHeight: 44, borderRadius: 12, border: 0, background: !text.trim() ? "#D9CBE2" : "linear-gradient(135deg,#B95DCA,#DB78BF)", color: "white", fontWeight: 900, fontSize: 13, cursor: !text.trim() ? "not-allowed" : "pointer", whiteSpace: "nowrap" }}>
              Save ✨
            </button>
          </div>
        </>
      ) : (
        <div role="status" aria-live="polite">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span aria-hidden="true" style={{ fontSize: 26 }}>💜</span>
            <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--pl-theme-ink,#6B5A7D)", flex: 1 }}>
              <strong style={{ color: "var(--pl-theme-ink,#3E2458)" }}>Tucked away.</strong> Your wins jar holds it now — sleep well.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShareOpen(true)}
            style={{ marginTop: 10, width: "100%", padding: "10px 12px", minHeight: 44, borderRadius: 12, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "white", color: "var(--pl-theme-ink,#75428C)", fontWeight: 900, fontSize: 13, cursor: "pointer" }}
          >
            Share your win 🌟
          </button>
        </div>
      )}
      {shareOpen && (
        <React.Suspense fallback={null}>
          <ShareWinModalLazy winText={text.trim()} onClose={() => setShareOpen(false)} />
        </React.Suspense>
      )}
    </section>
  );
}
