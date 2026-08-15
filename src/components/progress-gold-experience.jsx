import { GoldStoryView, GoldSpacesView } from "./progress-gold-views.jsx";

const STORAGE_KEY = "plushlife:gold-growth-experiment:v1";
const DAY_MS = 24 * 60 * 60 * 1000;

function readExperiment() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function writeExperiment(value) {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

function pickExperiment(props) {
  const areas = Array.isArray(props.careAreas) ? props.careAreas.filter((area) => Number(area.possible) > 0) : [];
  const weakest = areas.slice().sort((a, b) => (Number(a.pct) || 0) - (Number(b.pct) || 0))[0];
  const strongest = areas.slice().sort((a, b) => (Number(b.pct) || 0) - (Number(a.pct) || 0))[0];
  const overall = Number(props.weeklyOverallPct) || 0;
  const essential = Number(props.weeklyEssentialPct) || 0;
  const delta = props.weekOverWeekDelta == null ? null : Number(props.weekOverWeekDelta) || 0;

  if (weakest && (Number(weakest.pct) || 0) < 55) {
    return {
      id: `lighter-${String(weakest.label || "space").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      icon: "🪶",
      title: `Make ${weakest.label} lighter`,
      action: `For one week, keep ${weakest.label} to the smallest useful version you can manage. Aim for fewer visible decisions, not a higher score.`,
      why: `${weakest.label} is your lowest current care area at ${weakest.pct}%. PlushLife wants to test whether reducing friction helps it feel easier to start.`,
      targetArea: weakest.label,
      baselineAreaPct: Number(weakest.pct) || 0,
      baselineOverallPct: overall,
      baselineEssentialPct: essential,
    };
  }

  if (strongest && (Number(strongest.pct) || 0) >= 65) {
    return {
      id: `anchor-${String(strongest.label || "space").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
      icon: "🌱",
      title: `Borrow an anchor from ${strongest.label}`,
      action: `Choose one reliable cue from ${strongest.label} and place one small task immediately after it for the next week.`,
      why: `${strongest.label} is your steadiest current space at ${strongest.pct}%. PlushLife can test whether one familiar cue helps another task start more naturally.`,
      targetArea: strongest.label,
      baselineAreaPct: Number(strongest.pct) || 0,
      baselineOverallPct: overall,
      baselineEssentialPct: essential,
    };
  }

  if (delta != null && delta < -8) {
    return {
      id: "protect-essentials",
      icon: "💜",
      title: "Protect the tiny essentials",
      action: "For one week, keep only your most important essentials visually prominent and let bonus tasks stay truly optional.",
      why: `This week was ${Math.abs(delta)}% lighter than the previous one. PlushLife wants to test whether lowering visible load helps your core care recover without catch-up pressure.`,
      targetArea: null,
      baselineAreaPct: null,
      baselineOverallPct: overall,
      baselineEssentialPct: essential,
    };
  }

  return {
    id: "keep-visible-list-small",
    icon: "✨",
    title: "Keep the visible list small",
    action: "For one week, try keeping only about four important things visually prominent at once. Everything else can stay available without competing for attention.",
    why: "Your current week is steady enough for a low-risk experiment. PlushLife wants to learn whether fewer visible decisions makes starting feel easier.",
    targetArea: null,
    baselineAreaPct: null,
    baselineOverallPct: overall,
    baselineEssentialPct: essential,
  };
}

function findAreaPct(props, label) {
  if (!label) return null;
  const area = (Array.isArray(props.careAreas) ? props.careAreas : []).find((item) => item.label === label);
  return area ? Number(area.pct) || 0 : null;
}

function observedResult(experiment, props) {
  const currentOverall = Number(props.weeklyOverallPct) || 0;
  const currentEssential = Number(props.weeklyEssentialPct) || 0;
  const currentArea = findAreaPct(props, experiment.targetArea);
  const overallDelta = currentOverall - (Number(experiment.baselineOverallPct) || 0);
  const essentialDelta = currentEssential - (Number(experiment.baselineEssentialPct) || 0);
  const areaDelta = currentArea == null || experiment.baselineAreaPct == null ? null : currentArea - Number(experiment.baselineAreaPct);
  const signal = areaDelta != null ? areaDelta : Math.abs(essentialDelta) >= Math.abs(overallDelta) ? essentialDelta : overallDelta;
  const direction = signal >= 6 ? "better" : signal <= -6 ? "lower" : "steady";
  return { currentOverall, currentEssential, currentArea, overallDelta, essentialDelta, areaDelta, signal, direction };
}

function daysSince(timestamp) {
  if (!timestamp) return 0;
  return Math.max(0, Math.floor((Date.now() - Number(timestamp)) / DAY_MS));
}

function TinyButton({ children, onClick, primary = false }) {
  return <button type="button" onClick={onClick} style={{ minHeight: 44, padding: "7px 10px", borderRadius: 10, border: primary ? 0 : "1px solid #E4C878", background: primary ? "linear-gradient(135deg,#B36AD0,#7D72E8)" : "rgba(255,255,255,.92)", color: primary ? "white" : "#8A6711", fontWeight: 900, fontSize: 10.4, cursor: "pointer" }}>{children}</button>;
}

function PlushLab({ props }) {
  const suggestion = React.useMemo(() => pickExperiment(props), [props.weeklyOverallPct, props.weeklyEssentialPct, props.weekOverWeekDelta, props.careAreas]);
  const [experiment, setExperiment] = React.useState(() => readExperiment());
  const age = daysSince(experiment?.startedAt);
  const readyToReview = Boolean(experiment?.status === "running" && age >= 6);
  const observed = experiment ? observedResult(experiment, props) : null;

  const save = React.useCallback((next) => {
    setExperiment(next);
    writeExperiment(next);
  }, []);

  const start = React.useCallback(() => {
    save({ ...suggestion, status: "running", startedAt: Date.now(), feedback: null, completedAt: null });
  }, [save, suggestion]);

  const finish = React.useCallback((feedback) => {
    const result = observedResult(experiment, props);
    save({ ...experiment, status: "completed", feedback, completedAt: Date.now(), observed: result });
  }, [experiment, props, save]);

  const reset = React.useCallback(() => save(null), [save]);

  return <section data-plush-gold-lab="true" style={{ marginTop: 9, borderRadius: 14, border: "1px solid #E8D58E", background: "linear-gradient(145deg,#FFFDF2,#FFF7DF)", boxShadow: "0 3px 10px rgba(151,112,173,.05)", padding: "12px 13px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}>
      <div><div style={{ fontSize: 12.7, fontWeight: 900, color: "#8D6710" }}>🧪 PlushLab</div><div style={{ marginTop: 2, fontSize: 9.7, color: "#8E7B4A" }}>Gold learns what actually helps you.</div></div>
      <span style={{ padding: "3px 7px", borderRadius: 999, background: "#FFF3C8", border: "1px solid #E7CE76", color: "#916A00", fontSize: 9, fontWeight: 900 }}>✨ GOLD</span>
    </div>

    {!experiment && <>
      <div style={{ marginTop: 9, padding: "9px 10px", borderRadius: 11, background: "rgba(255,255,255,.8)", border: "1px solid #EEE0AE" }}>
        <div style={{ fontSize: 11, fontWeight: 900, color: "#69552B" }}>{suggestion.icon} This week&apos;s tiny experiment</div>
        <div style={{ marginTop: 4, fontSize: 11.3, fontWeight: 900, color: "#493D2D" }}>{suggestion.title}</div>
        <div style={{ marginTop: 4, fontSize: 10.5, lineHeight: 1.42, color: "#6F6247" }}>{suggestion.action}</div>
        <div style={{ marginTop: 7, paddingTop: 7, borderTop: "1px solid #EFE4BC", fontSize: 9.8, lineHeight: 1.4, color: "#8A7B58" }}><strong>Why this:</strong> {suggestion.why}</div>
      </div>
      <div style={{ marginTop: 8 }}><TinyButton primary onClick={start}>✨ Try this for a week</TinyButton></div>
    </>}

    {experiment?.status === "running" && <>
      <div style={{ marginTop: 9, padding: "9px 10px", borderRadius: 11, background: "rgba(255,255,255,.8)", border: "1px solid #EEE0AE" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><strong style={{ fontSize: 10.8, color: "#69552B" }}>{experiment.icon} In progress · {experiment.title}</strong><span style={{ fontSize: 9.4, color: "#9A8656", whiteSpace: "nowrap" }}>Day {Math.min(7, age + 1)} of 7</span></div>
        <div style={{ marginTop: 4, fontSize: 10.4, lineHeight: 1.4, color: "#6F6247" }}>{experiment.action}</div>
        {!readyToReview && <div style={{ marginTop: 7, fontSize: 9.7, color: "#8A7B58" }}>PlushLife captured the starting point. No need to track anything extra — just use the app normally.</div>}
        {readyToReview && <div style={{ marginTop: 8, paddingTop: 8, borderTop: "1px solid #EFE4BC" }}>
          <div style={{ fontSize: 10.5, fontWeight: 900, color: "#69552B" }}>Did this actually help?</div>
          <div style={{ marginTop: 3, fontSize: 9.8, lineHeight: 1.4, color: "#8A7B58" }}>{observed?.direction === "better" ? "The numbers moved in a helpful direction too, but your experience gets the final say." : observed?.direction === "lower" ? "The numbers were lower, but that does not automatically mean the experiment failed. How it felt matters." : "The numbers stayed fairly steady, so your own experience is especially useful here."}</div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 7 }}><TinyButton primary onClick={() => finish("helped")}>💜 Yes, it helped</TinyButton><TinyButton onClick={() => finish("neutral")}>🙂 Not sure</TinyButton><TinyButton onClick={() => finish("too_much")}>🪶 Too much</TinyButton></div>
        </div>}
      </div>
    </>}

    {experiment?.status === "completed" && <>
      <div style={{ marginTop: 9, padding: "9px 10px", borderRadius: 11, background: "rgba(255,255,255,.82)", border: "1px solid #EEE0AE" }}>
        <div style={{ fontSize: 10.8, fontWeight: 900, color: "#69552B" }}>✨ PlushLife learned something</div>
        <div style={{ marginTop: 5, fontSize: 10.5, lineHeight: 1.42, color: "#6F6247" }}>{experiment.feedback === "helped" ? `You said “${experiment.title}” helped. PlushLife will treat this kind of adjustment as a stronger fit for you in future suggestions.` : experiment.feedback === "too_much" ? `You said “${experiment.title}” felt like too much. PlushLife will down-rank similar suggestions and favor gentler options next time.` : `You were not sure whether “${experiment.title}” helped. PlushLife will keep this as weak evidence instead of turning it into a rule.`}</div>
        {experiment.observed && <div style={{ marginTop: 7, paddingTop: 7, borderTop: "1px solid #EFE4BC", fontSize: 9.7, lineHeight: 1.4, color: "#8A7B58" }}><strong>Observed alongside your feedback:</strong> essentials {experiment.observed.essentialDelta >= 0 ? "+" : ""}{experiment.observed.essentialDelta}% · overall {experiment.observed.overallDelta >= 0 ? "+" : ""}{experiment.observed.overallDelta}%{experiment.observed.areaDelta != null ? ` · ${experiment.targetArea} ${experiment.observed.areaDelta >= 0 ? "+" : ""}${experiment.observed.areaDelta}%` : ""}. This is context, not proof.</div>}
      </div>
      <div style={{ marginTop: 8 }}><TinyButton onClick={reset}>🌱 Let PlushLife choose another experiment</TinyButton></div>
    </>}
  </section>;
}

export function GoldStoryExperience(props) {
  return <><GoldStoryView {...props} /><PlushLab props={props} /></>;
}

export function GoldSpacesExperience(props) {
  return <><GoldSpacesView {...props} /><PlushLab props={props} /></>;
}
