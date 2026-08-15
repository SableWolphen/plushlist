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

export function CalmHomeControls({ onSettingsChange, selectDayType, setEssentialsPickerOpen, setCalmQuickOpen, setCareSection, goToDashboard, openTaskManager, nextStepTask, preferences }) {
  const [settings, setSettings] = React.useState(readSettings);
  const [command, setCommand] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [customizing, setCustomizing] = React.useState(false);
  const [online, setOnline] = React.useState(() => navigator.onLine);
  const [wasOffline, setWasOffline] = React.useState(false);
  const greeting = timeGreeting(settings.tone);

  React.useEffect(() => { applyAtmosphere(settings); onSettingsChange?.(settings); try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings)); } catch (_error) {} }, [settings]);
  React.useEffect(() => {
    const connected = () => { setOnline(true); setWasOffline(true); window.setTimeout(() => setWasOffline(false), 5000); };
    const disconnected = () => { setOnline(false); setWasOffline(true); };
    window.addEventListener("online", connected); window.addEventListener("offline", disconnected);
    return () => { window.removeEventListener("online", connected); window.removeEventListener("offline", disconnected); };
  }, []);

  const update = (patch) => setSettings((current) => ({ ...current, ...patch }));
  const runCommand = () => {
    const q = command.trim().toLowerCase();
    if (!q) return;
    if (/struggl|overwhelm|panic|exhaust|help me now/.test(q)) { setCalmQuickOpen?.(true); setMessage("Opening gentle support."); }
    else if (/tiny|minimal/.test(q)) { selectDayType?.("tiny"); setMessage("Today is now Tiny."); }
    else if (/soft|lighter|gentle/.test(q)) { selectDayType?.("soft"); setMessage("Today is now Soft."); }
    else if (/restart|essential/.test(q)) { setEssentialsPickerOpen?.(true); setMessage("Choose only the essentials you want to restart with."); }
    else if (/care|support/.test(q)) { setCareSection?.("quick"); goToDashboard?.("care"); }
    else if (/progress|growth|what works/.test(q)) goToDashboard?.("progress");
    else if (/remind|notification|setting/.test(q)) goToDashboard?.("settings");
    else if (/edit|task|habit/.test(q)) openTaskManager?.();
    else if (/next|one thing/.test(q) && nextStepTask) { document.getElementById("plushlife-smart-next-step")?.scrollIntoView?.({ behavior: "smooth", block: "center" }); setMessage(`Try ${nextStepTask.label || nextStepTask.title || "your next step"}.`); }
    else setMessage("Try “make today tiny,” “help me restart,” “open care,” “progress,” or “edit habits.”");
    setCommand("");
  };

  return <section aria-label="Calm controls" data-time-mode={greeting.period} style={{ marginBottom: 12, padding: 13, borderRadius: 17, border: "1px solid #DFD4E8", background: "linear-gradient(145deg,rgba(255,255,255,.94),rgba(246,241,250,.9))", filter: "saturate(var(--plush-home-saturation,1))" }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 10, alignItems: "center" }}>
      <div><div style={{ fontSize: 10.5, letterSpacing: ".11em", fontWeight: 900, color: "#8A6698" }}>{greeting.period.toUpperCase()} MODE</div><div style={{ marginTop: 3, fontSize: 14, fontWeight: 900, color: "#55445F" }}>{greeting.text}</div></div>
      <button type="button" onClick={() => setCustomizing((value) => !value)} aria-expanded={customizing} style={{ ...button(false), minWidth: 44 }} aria-label="Customize Home">⚙️</button>
    </div>
    {!online && <div role="status" style={{ marginTop: 9, padding: 8, borderRadius: 9, background: "#FFF6DF", color: "#8A681F", fontSize: 11.5, fontWeight: 800 }}>Offline — your changes are saved on this device and will sync when you reconnect.</div>}
    {online && wasOffline && <div role="status" style={{ marginTop: 9, padding: 8, borderRadius: 9, background: "#EDF9F4", color: "#397967", fontSize: 11.5, fontWeight: 800 }}>Back online — syncing quietly.</div>}
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginTop: 10 }}>
      <button type="button" onClick={() => setCalmQuickOpen?.(true)} style={{ ...button(true), background: "#8E67A4", color: "white", borderColor: "#8E67A4" }}>💜 I'm struggling</button>
      <button type="button" onClick={() => setEssentialsPickerOpen?.(true)} style={button(false)}>🌱 Help me restart</button>
    </div>
    <form onSubmit={(event) => { event.preventDefault(); runCommand(); }} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 7, marginTop: 8 }}>
      <input value={command} onChange={(event) => setCommand(event.target.value)} aria-label="Tell PlushLife what you need" placeholder="Tell PlushLife what you need…" style={{ minWidth: 0, minHeight: 44, padding: "9px 11px", borderRadius: 11, border: "1px solid #DED2E5", background: "white", color: "#55445F", fontSize: 12 }} />
      <button type="submit" style={button(false)}>Go</button>
    </form>
    {message && <div role="status" style={{ marginTop: 6, fontSize: 11.5, color: "#6B5875" }}>{message}</div>}
    {(preferences?.reminder_times || []).length >= 5 && <button type="button" onClick={() => goToDashboard?.("settings")} style={{ ...button(false), width: "100%", marginTop: 8 }}>🔔 You have many reminders — review what still helps</button>}
    {customizing && <div style={{ marginTop: 10, paddingTop: 10, borderTop: "1px solid #E9E0ED" }}>
      <div style={{ fontSize: 11, fontWeight: 900, color: "#705B7B" }}>CUSTOMIZE HOME</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 7 }}>{[["guide","First-week guide"],["insights","Smart insights"],["extras","Extra tools"]].map(([key,label]) => <button key={key} type="button" aria-pressed={settings[key]} onClick={() => update({ [key]: !settings[key] })} style={button(settings[key])}>{settings[key] ? "✓ " : ""}{label}</button>)}</div>
      <div style={{ marginTop: 10, fontSize: 11, fontWeight: 900, color: "#705B7B" }}>COMPANION TONE</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>{[["quiet","Quiet"],["warm","Warm"],["playful","Playful"],["direct","Direct"]].map(([value,label]) => <button key={value} type="button" aria-pressed={settings.tone === value} onClick={() => update({ tone: value })} style={button(settings.tone === value)}>{label}</button>)}</div>
      <div style={{ marginTop: 10, fontSize: 11, fontWeight: 900, color: "#705B7B" }}>BACKGROUND FEEL</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 6 }}>{[["quiet","Quiet"],["standard","Soft"],["rich","Cozy"]].map(([value,label]) => <button key={value} type="button" aria-pressed={settings.intensity === value} onClick={() => update({ intensity: value })} style={button(settings.intensity === value)}>{label}</button>)}</div>
    </div>}
  </section>;
}
