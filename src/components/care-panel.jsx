import { MamasCorner } from "./baby-mode.jsx";
import { CarePanel as ExistingCarePanel } from "./care-panel-existing.jsx";
import { EXTRA_PLUSH_PATHS } from "../plush-paths-extra.js";
import { hasGoldFeature } from "../plush-gold.js";
import { addCaringDay, localDay, pathAdaptation, recordMoment, recordPathFeedback, sleepMemory, supportMemory } from "../plush-memory.js";
import { beginRecommendation, forgetPattern, profileContext, recommendationFit, recordRecommendationOutcome, syncSessionOutcomes } from "../plush-profile.js";

const shellCard = { borderRadius: 14, border: "1px solid #CFE8E1", background: "linear-gradient(145deg,#F3FFFB,#FFF8FC)", boxShadow: "0 4px 14px rgba(49,140,121,.06)" };
const smallButton = { minHeight: 44, padding: "7px 9px", borderRadius: 10, border: "1px solid #D7BFE4", background: "white", color: "#76558A", fontWeight: 900, fontSize: 10.2, cursor: "pointer" };

function SituationButton({ option, selected, onClick }) {
  return <button type="button" aria-pressed={selected} onClick={onClick} style={{ minHeight: 58, padding: "9px 10px", borderRadius: 12, border: selected ? "2px solid #4A9D8B" : "1px solid #CFE8E1", background: selected ? "#F0FFF9" : "rgba(255,255,255,.88)", color: "#4F625D", textAlign: "left", fontWeight: 850, fontSize: 11.4, lineHeight: 1.3, cursor: "pointer", boxShadow: selected ? "0 3px 9px rgba(49,140,121,.08)" : "none" }}><span aria-hidden="true" style={{ fontSize: 18, marginRight: 6 }}>{option.icon}</span>{option.label}</button>;
}

export function CarePanel(props) {
  if (!props.open) return null;
  const { COMFORT_TOOLS, PLUSH_PATHS, SLEEP_TOOLS } = window.PlushLifeContent;
  const userId = props.user?.id || "local";
  const goldPathsUnlocked = hasGoldFeature("guided_gold_paths");
  const goldMemoryUnlocked = hasGoldFeature("advanced_growth_insights");
  if (!PLUSH_PATHS.__plushlifeExpanded) {
    const extras = EXTRA_PLUSH_PATHS.filter((path) => path.tier !== "gold" || goldPathsUnlocked).map((path) => path.tier === "gold" ? { ...path, title: `✨ Gold · ${path.title}` } : path);
    const known = new Set(PLUSH_PATHS.map((path) => path.id));
    PLUSH_PATHS.push(...extras.filter((path) => !known.has(path.id)));
    Object.defineProperty(PLUSH_PATHS, "__plushlifeExpanded", { value: true, enumerable: false });
  }

  const [selectedSituationId, setSelectedSituationId] = React.useState(null);
  const [pathFeedbackVersion, setPathFeedbackVersion] = React.useState(0);
  const [profileVersion, setProfileVersion] = React.useState(0);
  const options = Array.isArray(props.HELP_ME_NOW_OPTIONS) ? props.HELP_ME_NOW_OPTIONS : [];
  const visibleOptions = options.slice(0, props.careSituationsExpanded ? options.length : 4);
  const selectedSituation = options.find((option) => option.id === selectedSituationId) || null;
  const recommendedTool = selectedSituation ? COMFORT_TOOLS.find((tool) => tool.id === selectedSituation.tool) || null : null;
  const context = profileContext({ dailyCheckIn: props.dailyCheckIn || {}, rows: props.rows || [], viewDone: props.viewDone || {} });
  const memory = supportMemory(Array.isArray(props.careSessionHistory) ? props.careSessionHistory : [], COMFORT_TOOLS);
  const sleep = sleepMemory(Array.isArray(props.careSessionHistory) ? props.careSessionHistory : [], SLEEP_TOOLS);
  const careFit = memory.tool ? recommendationFit(userId, "care", memory.tool.id, context) : null;
  const sleepFit = sleep.tool ? recommendationFit(userId, "sleep", sleep.tool.id, context) : null;
  const activeProgress = (Array.isArray(props.pathProgress) ? props.pathProgress : []).find((entry) => entry?.status !== "paused" && PLUSH_PATHS.some((path) => path.id === entry.path_id && (entry.completed_days?.length || 0) < path.days.length));
  const activePath = activeProgress ? PLUSH_PATHS.find((path) => path.id === activeProgress.path_id) : null;
  const pathCoach = activePath ? pathAdaptation(userId, activePath.id) : null;
  void pathFeedbackVersion; void profileVersion;

  React.useEffect(() => {
    syncSessionOutcomes(userId, Array.isArray(props.careSessionHistory) ? props.careSessionHistory : []);
    setProfileVersion((value) => value + 1);
  }, [userId, props.careSessionHistory?.length]);

  const markCare = (text, kind = "care") => { addCaringDay(userId, localDay(), kind); recordMoment(userId, text, kind); };
  const startCare = (toolId) => {
    const tool = COMFORT_TOOLS.find((entry) => entry.id === toolId);
    beginRecommendation(userId, "care", toolId, context);
    markCare(tool ? `You chose ${tool.name} when you needed support.` : "You chose a care tool instead of pushing through alone.", "calm");
    props.openCareSession(toolId);
  };
  const startSleep = (toolId) => {
    const tool = SLEEP_TOOLS.find((entry) => entry.id === toolId);
    beginRecommendation(userId, "sleep", toolId, context);
    markCare(tool ? `You made room to wind down with ${tool.title}.` : "You made room for sleep support.", "sleep");
    props.setSleepToolOpen(toolId);
  };
  const chooseSituation = (option) => { setSelectedSituationId(option.id); props.setCareMessage(option.next); };
  const savePathFit = (feedback) => {
    if (!activePath) return;
    recordPathFeedback(userId, activePath.id, Number(activeProgress?.current_day) || 1, feedback);
    recordRecommendationOutcome(userId, "path", activePath.id, feedback, context);
    markCare(feedback === "helped" ? `You found a PlushPath step that helped in ${activePath.title}.` : feedback === "too_much" ? `You told PlushLife to make ${activePath.title} gentler.` : `You checked how ${activePath.title} was fitting instead of forcing an answer.`, "path");
    setPathFeedbackVersion((value) => value + 1);
  };

  return <div data-plushcare-redesign="true" style={{ marginBottom: 18, display: "grid", gap: 9 }}>
    <section style={{ ...shellCard, padding: "13px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}><div style={{ minWidth: 0 }}><div style={{ fontSize: 10.2, letterSpacing: ".14em", color: "#318C79", fontWeight: 900 }}>{props.babyMode ? "🧸 LITTLE COMFORT CORNER" : "♥ PLUSHCARE"}</div><div style={{ marginTop: 3, fontSize: 17.5, lineHeight: 1.18, color: "#4F405C", fontWeight: 900 }}>{props.babyMode ? "What does my little self need?" : "What would help right now?"}</div></div><button type="button" onClick={() => props.setCheckInPopupOpen(true)} style={{ minHeight: 44, padding: "7px 10px", borderRadius: 10, border: "1px solid #73B7A8", background: "white", color: "#318C79", fontWeight: 900, fontSize: 10.7, cursor: "pointer", flexShrink: 0 }}>{props.babyMode ? `${props.babyCaregiverName} Check-In` : "Update check-in"}</button></div>
      <div style={{ marginTop: 5, fontSize: 10.8, lineHeight: 1.45, color: "#607A73" }}>{props.babyMode ? "Pick what feels closest. We will choose one small thing together." : "Pick what feels closest. PlushLife will choose one small next step instead of giving you a whole menu."}</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 7, marginTop: 10 }}>{visibleOptions.map((option) => <SituationButton key={option.id} option={option} selected={selectedSituationId === option.id} onClick={() => chooseSituation(option)} />)}</div>
      <button type="button" onClick={() => props.setCareSituationsExpanded((expanded) => !expanded)} aria-expanded={props.careSituationsExpanded} style={{ marginTop: 7, minHeight: 44, padding: "6px 9px", borderRadius: 9, border: "1px solid #73B7A8", background: "white", color: "#318C79", fontWeight: 900, fontSize: 10.5, cursor: "pointer" }}>{props.careSituationsExpanded ? "Show fewer situations" : "Show more situations"}</button>
      {selectedSituation && <div aria-live="polite" style={{ marginTop: 9, padding: "10px 11px", borderRadius: 12, background: "#FFFFFFD9", border: "1px solid #CFE8E1" }}><div style={{ fontSize: 9.5, letterSpacing: ".11em", fontWeight: 900, color: "#318C79" }}>✨ BEST NEXT THING</div><div style={{ marginTop: 4, fontSize: 12.1, fontWeight: 900, color: "#4F625D" }}>{recommendedTool ? `${recommendedTool.icon} ${recommendedTool.name}` : `${selectedSituation.icon} One small care step`}</div><div style={{ marginTop: 4, fontSize: 10.6, lineHeight: 1.43, color: "#607A73" }}>{selectedSituation.next}</div><div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}><button type="button" onClick={() => startCare(selectedSituation.tool)} style={{ minHeight: 44, padding: "7px 11px", borderRadius: 10, border: 0, background: "linear-gradient(135deg,#52A792,#3E8C7D)", color: "white", fontWeight: 900, fontSize: 10.7, cursor: "pointer" }}>{props.babyMode ? "🧸 Do this with me" : "Start this"}</button><button type="button" onClick={() => props.setCareSection("quick")} style={{ minHeight: 44, padding: "7px 10px", borderRadius: 10, border: "1px solid #BFDCCF", background: "white", color: "#52736B", fontWeight: 850, fontSize: 10.3, cursor: "pointer" }}>🌿 Open PlushCalm</button></div></div>}
    </section>

    {goldMemoryUnlocked && <section style={{ ...shellCard, padding: "10px 11px", background: "linear-gradient(145deg,#F8F2FF,#FFFFFF)", borderColor: "#E3D2EC" }}><div style={{ fontSize: 9.7, letterSpacing: ".11em", fontWeight: 900, color: "#8E4EAA" }}>✨ GOLD · PLUSHMEMORY</div>{memory.tool ? <div style={{ marginTop: 5 }}><div style={{ display: "flex", gap: 8, justifyContent: "space-between", alignItems: "center" }}><div style={{ minWidth: 0, fontSize: 10.5, lineHeight: 1.42, color: "#806B8D" }}><strong>{memory.tool.name}</strong> has helped {memory.count} {memory.count === 1 ? "time" : "times"} when you checked afterward. {careFit?.confidence === "strong" && careFit.contextual >= 2 ? "It is also becoming a strong fit in situations similar to right now." : careFit?.confidence === "growing" ? "PlushLife has a growing contextual clue, but it is not a rule yet." : "PlushLife is still learning whether that carries over to situations like this one."}</div><button type="button" onClick={() => startCare(memory.tool.id)} style={smallButton}>Use again</button></div><button type="button" onClick={() => { forgetPattern(userId, "care", memory.tool.id); setProfileVersion((value) => value + 1); }} style={{ ...smallButton, marginTop: 6 }}>That changed / forget this</button></div> : <div style={{ marginTop: 4, fontSize: 10.4, lineHeight: 1.4, color: "#806B8D" }}>Still learning what works for you. After a care session, tell PlushLife whether it helped and the pattern will get more personal.</div>}</section>}

    {props.isMamaCornerProfile && <details open={props.careExtraSupportOpen} onToggle={(event) => props.setCareExtraSupportOpen(event.currentTarget.open)} style={{ borderRadius: 13, border: "1px solid #E6D4F2", background: "rgba(255,255,255,.72)", padding: "8px 10px" }}><summary style={{ minHeight: 44, display: "flex", alignItems: "center", color: "#76558A", fontWeight: 900, fontSize: 10.8, cursor: "pointer" }}>🧸 More cozy support</summary><div style={{ marginTop: 7 }}><MamasCorner userId={props.user.id} caregiverName={props.babyCaregiverName} parentVoice={props.preferences.baby_voice === "fatherly" ? "fatherly" : "motherly"} incompleteTasks={props.rows.filter((row) => !props.viewDone[row.key] && !row.isBonus)} onConfirmTask={(taskKey) => props.toggle(taskKey)} supabase={props.supabase} /></div></details>}

    <section aria-label="PlushCare main spaces" style={{ borderRadius: 14, border: "1px solid #E6D4F2", background: "rgba(255,255,255,.72)", padding: "9px" }}>
      <div style={{ padding: "2px 4px 8px" }}><div style={{ fontSize: 10.4, letterSpacing: ".12em", fontWeight: 900, color: "#8E4EAA" }}>✨ YOUR CARE SPACES</div><div style={{ marginTop: 3, fontSize: 10.4, lineHeight: 1.4, color: "#806B8D" }}>PlushCalm, PlushPaths, and PlushSleep are core parts of PlushCare — choose whichever kind of support fits right now.</div></div>
      {goldMemoryUnlocked && props.careSection === "paths" && activePath && <div data-adaptive-plushpath="true" style={{ margin: "0 3px 8px", padding: "9px 10px", borderRadius: 11, background: "#FFF9E9", border: "1px solid #E9D58B" }}><div style={{ fontSize: 9.5, letterSpacing: ".1em", fontWeight: 900, color: "#9B7100" }}>✨ GOLD · ADAPTIVE PLUSHPATH</div><div style={{ marginTop: 4, fontSize: 10.7, fontWeight: 900, color: "#6B5A32" }}>{activePath.icon} {activePath.title}</div><div style={{ marginTop: 3, fontSize: 10.2, lineHeight: 1.42, color: "#7B6A48" }}>{pathCoach?.text}</div><div style={{ marginTop: 7, fontSize: 9.8, fontWeight: 900, color: "#8A7445" }}>How is the current step fitting?</div><div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 5 }}><button type="button" onClick={() => savePathFit("helped")} style={smallButton}>💜 Helped</button><button type="button" onClick={() => savePathFit("neutral")} style={smallButton}>🙂 Not sure</button><button type="button" onClick={() => savePathFit("too_much")} style={smallButton}>🪶 Too much</button></div></div>}
      {goldMemoryUnlocked && <div style={{ margin: "0 3px 8px", padding: "8px 9px", borderRadius: 10, background: "#242D58", color: "#DCE3FA", border: "1px solid #3B4A85" }}><div style={{ fontSize: 9.4, letterSpacing: ".1em", fontWeight: 900, color: "#A9B9F5" }}>🌙 TONIGHT</div><div style={{ marginTop: 3, fontSize: 10.2, lineHeight: 1.4 }}>{sleep.text}{sleep.tool && sleepFit?.confidence === "strong" && sleepFit.contextual >= 2 ? " This is also a strong contextual fit for nights like this." : ""}</div>{sleep.tool && <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}><button type="button" onClick={() => { props.setCareSection("sleep"); startSleep(sleep.tool.id); }} style={{ ...smallButton, borderColor: "#6D80C3", background: "#344173", color: "white" }}>Try {sleep.tool.title}</button><button type="button" onClick={() => { forgetPattern(userId, "sleep", sleep.tool.id); setProfileVersion((value) => value + 1); }} style={{ ...smallButton, borderColor: "#6D80C3" }}>That changed</button></div>}</div>}
      <div className="plushcare-library"><style>{`.plushcare-library > div > :first-child{display:none!important}.plushcare-library > div{gap:9px!important;margin-bottom:0!important}.plushcare-library [role="tablist"]{margin-top:0!important}`}</style><ExistingCarePanel {...props} open={true} isMamaCornerProfile={false} openCareSession={startCare} setSleepToolOpen={startSleep} /></div>
    </section>
  </div>;
}
