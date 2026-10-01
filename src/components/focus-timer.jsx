import { ThemeScene } from "./theme-world.jsx";
// A gentle "do it with me" timer.
//
// Focus mode isolates one task but there was no time container for starting.
// This is a soft timer — 2/5/10/25 minutes — with the mascot present and a
// soft Web Audio chime at the end. The copy never scolds: cancelling or
// ignoring it is always fine. Session-only, nothing is persisted.
const TIMER_DURATIONS = [2, 5, 10, 25];

function playGentleChime() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    // Two soft sine notes, like a tiny music box. Nothing startling.
    [[523.25, 0], [783.99, 0.35]].forEach(([freq, offset]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.22, now + offset + 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 1.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 1.5);
    });
    window.setTimeout(() => { try { ctx.close(); } catch (_e) {} }, 2200);
  } catch (_error) {}
}

function formatClock(totalSeconds) {
  const s = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(s / 60);
  const rest = s % 60;
  return `${m}:${String(rest).padStart(2, "0")}`;
}

// The timer dialog is opened by dispatching this event (home header button,
// Shape-my-day card, …). Keeping the trigger as an event means the floating
// button never has to overlap page content.
export function startFocusTimer(detail = {}) {
  window.dispatchEvent(new CustomEvent("plushlife:start-focus-timer", {detail}));
}

export function FocusTimer() {
  const [task, setTask] = React.useState({});
  const [sound, setSound] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [durationMin, setDurationMin] = React.useState(5);
  const [remaining, setRemaining] = React.useState(5 * 60);
  const [running, setRunning] = React.useState(false);
  const [finished, setFinished] = React.useState(false);
  const timerRef = React.useRef(null);
  const dialogRef = React.useRef(null);
  const soundRef = React.useRef(false);
  soundRef.current = sound;

  const clearTimer = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  };

  React.useEffect(() => {
    const onStart = event => {
      clearTimer();
      const minutes = TIMER_DURATIONS.includes(event.detail?.minutes) ? event.detail.minutes : durationMin;
      setDurationMin(minutes);
      setTask({label:event.detail?.taskLabel || "",step:event.detail?.step || ""});
      setFinished(false);
      setRunning(false);
      setRemaining(minutes * 60);
      setOpen(true);
    };
    window.addEventListener("plushlife:start-focus-timer", onStart);
    return () => {
      window.removeEventListener("plushlife:start-focus-timer", onStart);
      clearTimer();
    };
  }, [durationMin]);

  React.useEffect(() => () => clearTimer(), []);

  const start = () => {
    clearTimer();
    setFinished(false);
    setRemaining(durationMin * 60);
    setRunning(true);
    const endAt = Date.now() + durationMin * 60 * 1000;
    timerRef.current = window.setInterval(() => {
      const left = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      setRemaining(left);
      if (left <= 0) {
        clearTimer();
        setRunning(false);
        setFinished(true);
        if(soundRef.current) playGentleChime();
      }
    }, 500);
  };

  const stop = (done) => {
    clearTimer();
    setRunning(false);
    if (done) {
      setFinished(true);
      if(soundRef.current) playGentleChime();
    } else {
      setOpen(false);
    }
  };

  const close = () => {
    clearTimer();
    setRunning(false);
    setOpen(false);
    setFinished(false);
  };

  React.useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const panel = dialogRef.current;
    panel?.focus();
    const handleKey = event => {
      if (event.key === 'Escape') { event.preventDefault(); clearTimer(); setRunning(false); setOpen(false); setFinished(false); }
      if (event.key === 'Tab') {
        const controls = Array.from(panel?.querySelectorAll('button:not(:disabled),input:not(:disabled)') || []);
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {event.preventDefault();last?.focus();}
        else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel)) {event.preventDefault();first?.focus();}
      }
    };
    document.addEventListener('keydown',handleKey);
    return () => {document.removeEventListener('keydown',handleKey);previous?.focus?.();};
  }, [open]);

  const progress = durationMin > 0 ? 1 - remaining / (durationMin * 60) : 0;

  return (
    <>
      {open && (
        <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Gentle timer" style={{ position: "fixed", inset: 0, zIndex: 200, display: "grid", placeItems: "center", padding: 20, boxSizing: "border-box", background: "rgba(43,29,52,.5)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
          <div style={{ width: "min(400px, 100%)", boxSizing: "border-box", maxHeight: "calc(100dvh - 40px)", overflowY: "auto", borderRadius: 24, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface)", boxShadow: "0 24px 70px rgba(42,26,52,.35)", padding: 24, textAlign: "center", color: "var(--pl-theme-ink,#5B4B6B)" }}>
            <div style={{display:"flex",justifyContent:"center"}}><ThemeScene focus decorative /></div>
            {task.label&&<p style={{fontWeight:800,overflowWrap:"anywhere"}}>{task.label}</p>}
            {task.step&&<p>{task.step}</p>}
            <label style={{display:"flex",justifyContent:"center",alignItems:"center",gap:8,minHeight:44}}><input type="checkbox" checked={sound} onChange={event=>setSound(event.target.checked)}/>A soft chime when I finish</label>
            {!finished ? (
              <>
                <div style={{ marginTop: 6, fontSize: 12, letterSpacing: ".13em", fontWeight: 950, color: "var(--pl-theme-muted,#B44CC7)" }}>A GENTLE TIMER</div>
                <div style={{ marginTop: 10, fontSize: 52, fontWeight: 950, color: "var(--pl-theme-ink,#3E2458)", letterSpacing: "-1px", fontVariantNumeric: "tabular-nums" }}>{formatClock(remaining)}</div>
                <div style={{ height: 8, borderRadius: 999, background: "var(--pl-theme-surface-2,#EFE2F5)", marginTop: 10, overflow: "hidden" }}>
                  <div style={{ height: "100%", width: `${Math.min(100, Math.max(0, progress * 100))}%`, borderRadius: 999, background: "var(--pl-theme-accent)", transition: "width .5s linear" }} />
                </div>
                <p style={{ margin: "12px 0 0", fontSize: 13, lineHeight: 1.55, color: "var(--pl-theme-muted,#7B6888)" }}>
                  {running
                    ? "No rush — the timer is just keeping you company. Stopping early is always okay."
                    : "Pick a little pocket of time. The timer won\u2019t scold you; it\u2019s just here to sit with you while you start."}
                </p>
                {!running && (
                  <div style={{ display: "flex", gap: 7, justifyContent: "center", marginTop: 14, flexWrap: "wrap" }}>
                    {TIMER_DURATIONS.map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => { setDurationMin(mins); setRemaining(mins * 60); }}
                        aria-pressed={durationMin === mins}
                        style={{ minWidth: 56, minHeight: 44, padding: "8px 12px", borderRadius: 12, border: durationMin === mins ? "2px solid #A65DC1" : "1px solid #E4CFF0", background: durationMin === mins ? "#F2DEFA" : "white", color: durationMin === mins ? "#7E3D99" : "#6B5A7D", fontWeight: 900, fontSize: 13, cursor: "pointer" }}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                )}
                <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
                  {!running
                    ? <button type="button" onClick={start} style={{ flex: 1, minHeight: 48, borderRadius: 14, border: 0, background: "var(--pl-theme-accent)", color: "white", fontWeight: 900, fontSize: 14, cursor: "pointer" }}>Start softly ⏱</button>
                    : <button type="button" onClick={() => stop(true)} style={{ flex: 1, minHeight: 48, borderRadius: 14, border: 0, background: "var(--pl-theme-accent)", color: "white", fontWeight: 900, fontSize: 14, cursor: "pointer" }}>I&rsquo;m done ✓</button>}
                  <button type="button" onClick={close} style={{ minHeight: 48, padding: "0 18px", borderRadius: 14, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "white", color: "var(--pl-theme-muted,#8B6797)", fontWeight: 800, fontSize: 14, cursor: "pointer" }}>{running ? "Stop" : "Close"}</button>
                </div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 44 }} aria-hidden="true">🌷</div>
                <div style={{ marginTop: 8, fontSize: 19, fontWeight: 950, color: "var(--pl-theme-ink,#3E2458)" }}>Done for now</div>
                <p style={{ margin: "8px 0 0", fontSize: 13.5, lineHeight: 1.55, color: "var(--pl-theme-muted,#7B6888)" }}>You showed up — that&rsquo;s what counts. The rest of the day can wait.</p>
                <button type="button" onClick={close} autoFocus style={{ marginTop: 16, width: "100%", minHeight: 48, borderRadius: 14, border: 0, background: "var(--pl-theme-accent)", color: "white", fontWeight: 900, fontSize: 14, cursor: "pointer" }}>Back to my day 💜</button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
