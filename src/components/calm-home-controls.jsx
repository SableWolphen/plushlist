const STORAGE_KEY = "plushlife:calm-home:v1";

const DEFAULTS = { guide: true, insights: true, extras: true, tone: "warm", intensity: "standard" };

function readSettings() {
  try { return { ...DEFAULTS, ...JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}") }; }
  catch (_error) { return DEFAULTS; }
}

function applyAtmosphere(settings) {
  const root = document.documentElement;
  root.dataset.plushTone = settings.tone;
  root.dataset.plushAtmosphere = settings.intensity;
  root.style.setProperty("--plush-home-saturation", settings.intensity === "quiet" ? ".72" : settings.intensity === "rich" ? "1.12" : "1");
}

function timeGreeting(tone) {
  const hour = new Date().getHours();
  const period = hour < 5 ? "night" : hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";
  const copy = {
    quiet: { morning: "A quiet start", afternoon: "One thing at a time", evening: "Let the day soften", night: "Only what you need" },
    playful: { morning: "Tiny steps, big cozy energy", afternoon: "Let's make one little win", evening: "Cozy mode is on", night: "Night-owl care mode" },
    direct: { morning: "Choose today's priority", afternoon: "Choose the next useful step", evening: "Close the day gently", night: "Keep tonight minimal" },
    warm: { morning: "Good morning — we can start gently", afternoon: "You're allowed to take this one step at a time", evening: "Let's make the rest of today softer", night: "Nothing has to be big tonight" },
  };
  return { period, text: (copy[tone] || copy.warm)[period] };
}

const button = (active = false) => ({ minHeight: 44, padding: "8px 11px", borderRadius: 11, border: active ? "2px solid #8E67A4" : "1px solid #DED2E5", background: active ? "#F5EDFA" : "white", color: "#675472", fontWeight: 900, fontSize: 11.5, cursor: "pointer" });
const chip = { minHeight: 36, padding: "6px 9px", borderRadius: 999, border: "1px solid #E1D6E6", background: "rgba(255,255,255,.88)", color: "#705A7B", fontWeight: 850, fontSize: 10.5, cursor: "pointer" };

export function CalmHomeControls({ onSettingsChange, selectDayType, setEssentialsPickerOpen, setCalmQuickOpen, setCareSection, goToDashboard, openTaskManager, nextStepTask, preferences }) {
  const [settings, setSettings] = React.useState(readSettings);
  const [command, setCommand] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [customizing, setCustomizing] = React.useState(false);
  const [online, setOnline] = React.useState(() => navigator.onLine);
  const [wasOffline, setWasOffline] = React.useState(false);
  const commandRef = React.useRef(null);
  const greeting = timeGreeting(settings.tone);

  React.useEffect(() => { applyAtmosphere(settings); onSettingsChange?.(settings); try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (_error) {} }, [settings]);
  React.useEffect(() => {
    const connected = () => { setOnline(true); setWasOffline(true); window.setTimeout(() => setWasOffline(false), 5000); };
    const disconnected = () => { setOnline(false); setWasOffline(true); };
    window.addEventListener("online", connected); window.addEventListener("offline", disconnected);
    return () => { window.removeEventListener("online", connected); window.removeEventListener("offline", disconnected); };
  }, []);
  React.useEffect(() => {
    const focusCommand = (event) => {
      if (event.key !== "/" || event.metaKey || event.ctrlKey || event.altKey) return;
      const tag = String(event.target?.tagName || "").toLowerCase();
      if (["input", "textarea", "select"].includes(tag) || event.target?.isContentEditable) return;
      event.preventDefault();
      commandRef.current?.focus?.();
    };
    window.addEventListener("keydown", focusCommand);
    return () => window.removeEventListener("keydown", focusCommand);
  }, []);

  const update = (patch) => setSettings((current) => ({ ...current, ...patch }));
  const runCommand = (rawCommand = command) => {
    const q = String(rawCommand || "").trim().toLowerCase();
    if (!q) return;
    if (/struggl|overwhelm|panic|exhaust|help me now|bad day/.test(q)) { setCalmQuickOpen?.(true); setMessage("Opening gentle support."); }
    else if (/tiny|minimal|smallest/.test(q)) { selectDayType?.("tiny"); setMessage("Today is now Tiny. Only the smallest useful steps need attention."); }
    else if (/soft|lighter|gentle/.test(q)) { selectDayType?.("soft"); setMessage("Today is now Soft. PlushLife will keep the rest gentler."); }
    else if (/full|normal day|whole routine/.test(q)) { selectDayType?.("full"); setMessage("Full Day is back."); }
    else if (/restart|essential|only important/.test(q)) { setEssentialsPickerOpen?.(true); setMessage("Choose only the essentials you want to restart with."); }
    else if (/care|support/.test(q)) { setCareSection?.("quick"); goToDashboard?.("care"); setMessage("Opening Care."); }
    else if (/progress|growth|what works|patterns/.test(q)) { goToDashboard?.("progress"); setMessage("Opening your patterns and progress."); }
    else if (/remind|notification|setting|accessibility|simple view/.test(q)) { goToDashboard?.("settings"); setMessage("Opening Settings."); }
    else if (/add|new|create|edit|task|habit|routine/.test(q)) { openTaskManager?.(); setMessage("Opening tasks. You can add, search, edit, or import from one place."); }
    else if (/next|one thing|what now|what should i do/.test(q) && nextStepTask) {
      document.getElementById("plushlife-smart-next-step")?.scrollIntoView?.({ behavior: "smooth", block: "center" });
      setMessage(`Your next useful step is ${nextStepTask.label || nextStepTask.title || "ready"}.`);
    }
    else if (/next|one thing|what now|what should i do/.test(q)) setMessage("You're caught up on the next step right now.");
    else setMessage("Try “what should I do?”, “make today tiny,” “add a habit,” “help me restart,” “progress,” or “settings.”");
    setCommand("");
  };
  const applySimpleHome = () => {
    setSettings((current) => ({ ...current, guide: false, insights: false, extras: false, tone: "direct", intensity: "quiet" }));
    setCustomizing(false);
    setMessage("Simple Home is on — fewer decisions, quieter visuals, same data.");
  };

  return <section aria-label="Calm controls" data-time-mode={greeting.period} style={{ marginBottom: 12, padding: 13, borderRadius: 17, border: "1px solid #DFD4E8", background: "linear-gradient(145deg,rgba(255,255,255,.94),rgba(246,241,250,.9))", filter: "saturate(var(--plush-home-saturation,1))" }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
      <div><div style={{ fontSize: 10.5, letterSpacing: ".11em", fontWeight: 900, color: "#8A6698" }}>{greeting.period.toUpperCase()} MODE</div><div style={{ marginTop: 3, fontSize: 14, fontWeight: 900, color: "#55445F" }}>{greeting.text}</div></div>
      <button type="button" onClick={() => setCustomizing((value) => !value)} aria-expanded={customizing} style={{ ...button(false), minWidth: 44 }} aria-label="Customize Home">⚙️</button>
    </div>
    {!online && <div role="status" style={{ marginTop: 9, padding: 8, borderRadius: 9, background: "#FFF6DF", color: "#8A681F", fontSize: 11.5, fontWeight: 800 }}>Offline — your changes are saved on this device and will sync when you reconnect.</div>}
    {online && wasOffline && <div role="status" style={{ marginTop: 9, padding: 8, borderRadius: 9, background: "#EDF9F4", color: "#397967", fontSize: 11.5, fontWeight: 800 }}>Back online — syncing quietly.</div>}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginTop: 10 }}>
      <button type="button" onClick={() => runCommand("what should I do")} style={{ ...button(true), background: "#8E67A4", color: "white", borderColor: "#8E67A4" }}>🎯 What should I do?</button>
      <button type="button" onClick={() => setCalmQuickOpen?.(true)} style={button(false)}>💜 I'm struggling</button>
    </div>
    <form onSubmit={(event) => { event.preventDefault(); runCommand(); }} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 7, marginTop: 8 }}>
      <input ref={commandRef} value={command} onChange={(event) => setCommand(event.target.value)} aria-label="Tell PlushLife what you need" placeholder="What do you want to do?" enterKeyHint="go" autoComplete="off" style={{ minWidth: 0, minHeight: 44, padding: "9px 11px", borderRadius: 11, border: "1px solid #DED2E5", background: "white", color: "#55445F", fontSize: 12 }} />
      <button type="submit" disabled={!command.trim()} style={{ ...button(false), opacity: command.trim() ? 1 : .55 }}>Go</button>
    </form>
    <div aria-label="Quick actions" style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 7 }}>
      <button type="button" onClick={() => runCommand("make today tiny")} style={chip}>🌱 Tiny day</button>
      <button type="button" onClick={() => runCommand("add a habit")} style={chip}>＋ Add habit</button>
      <button type="button" onClick={() => runCommand("help me restart")} style={chip}>↺ Restart</button>
      <button type="button" onClick={() => runCommand("show progress")} style={chip}>✨ Progress</button>
    </div>
    <div style={{ marginTop: 5, fontSize: 9.8, color: "#9A8AA3" }}>Tip: press / on a keyboard to jump here.</div>
    {message && <div role="status" aria-live="polite" style={{ marginTop: 7, padding: "7px 9px", borderRadius: 9, background: "#F8F3FA", fontSize: 11.5, lineHeight: 1.4, color: "#6B5875" }}>{message}</div>}
    {(preferences?.reminder_times || []).length >= 5 && <button type="button" onClick={() => goToDashboard?.("settings")} style={{ ...button(false), width: "100%", marginTop: 8 }}>🔔 You have many reminders — review what still helps</button>}
    {customizing && <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #E9E0ED" }}>
      <button type="button" onClick={applySimpleHome} style={{ ...button(true), width: "100%", background: "#5F746E", borderColor: "#5F746E", color: "white" }}>✨ Make Home simpler</button>
      <div style={{ marginTop: 5, fontSize: 10.5, lineHeight: 1.4, color: "#85748F" }}>One tap hides optional Home extras, quiets the visuals, and keeps your tasks and progress unchanged.</div>
      <div style={{ marginTop: 10, fontSize: 11, fontWeight: 900, color: "#705B7B" }}>CUSTOMIZE HOME</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 7 }}>{[["guide","First-week guide"],["insights","Smart insights"],["extras","Extra tools"]].map(([key,label]) => <button key={key} type="button" aria-pressed={settings[key]} onClick={() => update({ [key]: !settings[key] })} style={button(settings[key])}>{settings[key] ? "✓ " : ""}{label}</button>)}</div>
      <div style={{ marginTop: 10, fontSize: 11, fontWeight: 900, color: "#705B7B" }}>COMPANION TONE</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>{[["quiet","Quiet"],["warm","Warm"],["playful","Playful"],["direct","Direct"]].map(([value,label]) => <button key={value} type="button" aria-pressed={settings.tone === value} onClick={() => update({ tone: value })} style={button(settings.tone === value)}>{label}</button>)}</div>
      <div style={{ marginTop: 10, fontSize: 11, fontWeight: 900, color: "#705B7B" }}>BACKGROUND FEEL</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>{[["quiet","Quiet"],["standard","Soft"],["rich","Cozy"]].map(([value,label]) => <button key={value} type="button" aria-pressed={settings.intensity === value} onClick={() => update({ intensity: value })} style={button(settings.intensity === value)}>{label}</button>)}</div>
    </div>}
  </section>;
}
