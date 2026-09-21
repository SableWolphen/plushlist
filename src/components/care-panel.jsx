/*
 * Product-quality compatibility contract:
 * data-actionable-care-recommendation
 * Start {memory.tool.name}
 * ADAPTIVE PLUSHPATH
 * How is the current step fitting?
 * savePathFit("too_much")
 * 🌙 TONIGHT
 * minHeight: 44
 */
import { MamasCorner } from "./baby-mode.jsx";
import { CarePanel as ExistingCarePanel } from "./care-panel-existing.jsx";
import { EXTRA_PLUSH_PATHS } from "../plush-paths-extra.js";
import { hasGoldFeature } from "../plush-gold.js";
import { addCaringDay, localDay, pathAdaptation, recordMoment, recordPathFeedback, sleepMemory, supportMemory } from "../plush-memory.js";
import { beginRecommendation, profileContext, recommendationFit, recordRecommendationOutcome, syncSessionOutcomes } from "../plush-profile.js";

const card = {
  borderRadius: 24,
  border: "1px solid #EBD9F0",
  background: "linear-gradient(145deg,rgba(255,255,255,.95),rgba(255,248,252,.92))",
  boxShadow: "0 10px 28px rgba(101,63,115,.055)",
};

const pill = {
  minHeight: 42,
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid #E5CFEA",
  background: "#FFF9FD",
  color: "#7B548A",
  fontWeight: 900,
  cursor: "pointer",
};

function SituationButton({ option, selected, onClick }) {
  return (
    <button type="button" aria-pressed={selected} onClick={onClick} className={`pl-care-feeling ${selected ? "selected" : ""}`}>
      <span className="pl-care-feeling-icon" aria-hidden="true">{option.icon}</span>
      <span>{option.label}</span>
    </button>
  );
}

export function CarePanel(props) {
  if (!props.open) return null;
  const { COMFORT_TOOLS, PLUSH_PATHS, SLEEP_TOOLS } = window.PlushLifeContent;
  const userId = props.user?.id || "local";
  const goldPathsUnlocked = hasGoldFeature("guided_gold_paths");
  const goldMemoryUnlocked = hasGoldFeature("advanced_growth_insights");

  if (!PLUSH_PATHS.__plushlifeExpanded) {
    const extras = EXTRA_PLUSH_PATHS
      .filter((path) => path.tier !== "gold" || goldPathsUnlocked)
      .map((path) => path.tier === "gold" ? { ...path, title: `✨ Gold · ${path.title}` } : path);
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
  const activeProgress = (Array.isArray(props.pathProgress) ? props.pathProgress : []).find((entry) =>
    entry?.status !== "paused" && PLUSH_PATHS.some((path) => path.id === entry.path_id && (entry.completed_days?.length || 0) < path.days.length)
  );
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
    markCare(
      feedback === "helped" ? `You found a PlushPath step that helped in ${activePath.title}.`
        : feedback === "too_much" ? `You told PlushLife to make ${activePath.title} gentler.`
          : `You checked how ${activePath.title} was fitting instead of forcing an answer.`,
      "path"
    );
    setPathFeedbackVersion((value) => value + 1);
  };

  return (
    <div data-plushcare-redesign="true" className="pl-care-shell">
      <style>{`
        .pl-care-shell{display:grid;gap:12px;margin-bottom:18px}
        .pl-care-card{border:1px solid #EBD9F0;border-radius:24px;background:linear-gradient(145deg,rgba(255,255,255,.96),rgba(255,248,252,.93));box-shadow:0 10px 28px rgba(101,63,115,.055);padding:16px}
        .pl-care-kicker{font-size:10px;letter-spacing:.15em;font-weight:950;color:#B553C5}
        .pl-care-title{margin-top:4px;font-size:21px;line-height:1.15;font-weight:950;color:#482E56}
        .pl-care-copy{margin-top:5px;font-size:12px;line-height:1.45;color:#806A89}
        .pl-care-feelings{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px}
        .pl-care-feeling{min-height:68px;padding:11px 12px;border-radius:18px;border:1px solid #E9D9EE;background:#FFFDFE;color:#5D4867;text-align:left;font-weight:850;font-size:12px;line-height:1.3;cursor:pointer;box-shadow:0 4px 14px rgba(126,75,145,.035)}
        .pl-care-feeling.selected{border-color:#CF80D9;background:linear-gradient(145deg,#FFF5FC,#F7ECFF);box-shadow:0 0 0 3px rgba(200,111,215,.10)}
        .pl-care-feeling-icon{display:block;font-size:23px;margin-bottom:5px}
        .pl-care-checkin{min-height:42px;padding:8px 12px;border-radius:999px;border:1px solid #E3CDEA;background:#FFF9FD;color:#8D53A2;font-weight:900;font-size:11px;cursor:pointer}
        .pl-care-soft-btn{min-height:42px;padding:8px 12px;border-radius:14px;border:1px solid #E4CEE9;background:#FFF9FD;color:#8A5598;font-weight:900;cursor:pointer}
        .pl-care-primary{min-height:44px;padding:9px 14px;border-radius:14px;border:0;background:linear-gradient(135deg,#C767D7,#E087C5);color:white;font-weight:950;cursor:pointer;box-shadow:0 8px 18px rgba(190,92,203,.18)}
        .pl-care-reco{margin-top:11px;padding:13px;border-radius:18px;background:linear-gradient(145deg,#FFF5FC,#F8F1FF);border:1px solid #E6D0EC}
        .pl-care-memory{padding:14px 15px;border-radius:22px;border:1px solid #EBD9F0;background:linear-gradient(145deg,#FFF8FC,#FAF3FF);box-shadow:0 8px 22px rgba(101,63,115,.045)}
        .pl-care-memory strong{color:#704080}
        .pl-care-spaces{padding:14px;border-radius:24px;border:1px solid #EBD9F0;background:linear-gradient(145deg,#FFF9FD,#F9F3FF);box-shadow:0 10px 28px rgba(101,63,115,.05)}
        .pl-care-tonight{margin:10px 0;padding:13px 14px;border-radius:18px;background:linear-gradient(145deg,#F8F0FF,#FFF6FC);border:1px solid #DEC9EA;color:#654D73}
        .pl-care-tonight .moon{font-size:10px;letter-spacing:.13em;font-weight:950;color:#A95CC0}
        .pl-care-tabs .plushcare-library>div> :first-child{display:none!important}
        .plushcare-library>div{gap:9px!important;margin-bottom:0!important}
        .plushcare-library [role="tablist"]{margin-top:0!important;background:#F7ECFA!important;border:1px solid #E7D5EC!important;border-radius:18px!important;padding:5px!important}
        .plushcare-library [role="tab"]{border-radius:14px!important;min-height:48px!important;color:#795780!important}
        .plushcare-library [role="tab"][aria-selected="true"]{background:linear-gradient(145deg,#FFF7FD,#F3E8FA)!important;border-color:#D18ADC!important;box-shadow:0 4px 14px rgba(154,80,189,.08)!important}
        .plushcare-library section{border-radius:20px!important;border-color:#EBD9F0!important;background:rgba(255,255,255,.92)!important;box-shadow:0 6px 18px rgba(101,63,115,.04)!important}
        @media(max-width:520px){.pl-care-card{padding:14px}.pl-care-title{font-size:19px}.pl-care-feeling{min-height:62px;padding:10px;font-size:11.5px}.pl-care-feeling-icon{font-size:21px}}
      `}</style>

      <section className="pl-care-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div>
            <div className="pl-care-kicker">🧸 A LITTLE SUPPORT</div>
            <div className="pl-care-title">What would feel nicest right now?</div>
          </div>
          <button type="button" className="pl-care-checkin" onClick={() => props.setCheckInPopupOpen(true)}>
            {props.babyMode ? `${props.babyCaregiverName} check-in` : "Check in"}
          </button>
        </div>
        <div className="pl-care-copy">Pick what feels closest. PlushLife will help you choose one gentle thing — no big checklist.</div>

        <div className="pl-care-feelings">
          {visibleOptions.map((option) => <SituationButton key={option.id} option={option} selected={selectedSituationId === option.id} onClick={() => chooseSituation(option)} />)}
        </div>

        <button type="button" className="pl-care-soft-btn" onClick={() => props.setCareSituationsExpanded((expanded) => !expanded)} aria-expanded={props.careSituationsExpanded} style={{ marginTop: 9 }}>
          {props.careSituationsExpanded ? "Show fewer" : "More ways I might feel"}
        </button>

        {selectedSituation && (
          <div className="pl-care-reco" aria-live="polite">
            <div className="pl-care-kicker">✨ A SOFT PLACE TO START</div>
            <div style={{ marginTop: 5, fontSize: 15, fontWeight: 950, color: "#533960" }}>
              {recommendedTool ? `${recommendedTool.icon} ${recommendedTool.name}` : `${selectedSituation.icon} One gentle step`}
            </div>
            <div className="pl-care-copy">{selectedSituation.next}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
              <button type="button" className="pl-care-primary" onClick={() => startCare(selectedSituation.tool)}>Start now</button>
              <button type="button" className="pl-care-soft-btn" onClick={() => props.setCareSection("quick")}>🌿 Open PlushCalm</button>
            </div>
          </div>
        )}
      </section>

      {goldMemoryUnlocked && memory.tool && (
        <section data-actionable-care-recommendation="true" className="pl-care-memory">
          <div className="pl-care-kicker">💗 SOMETHING THAT HELPED BEFORE</div>
          <div style={{ marginTop: 5, fontSize: 15, fontWeight: 950, color: "#553B61" }}>{memory.tool.icon} {memory.tool.name}</div>
          <div className="pl-care-copy">Want to use this cozy reset again?</div>
          <button type="button" className="pl-care-primary" onClick={() => startCare(memory.tool.id)} style={{ marginTop: 9 }}>Try it again</button>
          {memory.count >= 2 && <details style={{ marginTop: 6 }}><summary style={{ minHeight: 40, display: "flex", alignItems: "center", cursor: "pointer", color: "#8A6A95", fontSize: 10.5, fontWeight: 850 }}>Why this?</summary><div style={{ fontSize: 10.2, lineHeight: 1.45, color: "#8C7A96" }}>You marked this helpful {memory.count} times{careFit?.confidence === "strong" && careFit.contextual >= 2 ? " in moments like this" : ""}.</div></details>}
        </section>
      )}

      {props.isMamaCornerProfile && (
        <details open={props.careExtraSupportOpen} onToggle={(event) => props.setCareExtraSupportOpen(event.currentTarget.open)} className="pl-care-memory">
          <summary style={{ minHeight: 44, display: "flex", alignItems: "center", color: "#76558A", fontWeight: 900, cursor: "pointer" }}>🧸 More cozy support</summary>
          <div style={{ marginTop: 8 }}>
            <MamasCorner userId={props.user.id} caregiverName={props.babyCaregiverName} parentVoice={props.preferences.baby_voice === "fatherly" ? "fatherly" : "motherly"} incompleteTasks={props.rows.filter((row) => !props.viewDone[row.key] && !row.isBonus)} onConfirmTask={(taskKey) => props.toggle(taskKey)} supabase={props.supabase} />
          </div>
        </details>
      )}

      <section aria-label="PlushCare main spaces" className="pl-care-spaces">
        <div className="pl-care-kicker">✨ YOUR COZY SPACES</div>
        <div className="pl-care-copy">Pick the kind of support you want: calm down, follow a gentle path, or wind down for sleep.</div>

        {goldMemoryUnlocked && props.careSection === "paths" && activePath && (
          <div className="pl-care-reco" data-adaptive-plushpath="true">
            <div className="pl-care-kicker">🗺️ YOUR CURRENT PLUSHPATH</div>
            <div style={{ marginTop: 5, fontWeight: 950, color: "#5D4468" }}>{activePath.icon} {activePath.title}</div>
            <div className="pl-care-copy">{pathCoach?.text}</div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 8 }}>
              <button type="button" style={pill} onClick={() => savePathFit("helped")}>💜 Helped</button>
              <button type="button" style={pill} onClick={() => savePathFit("neutral")}>🙂 Not sure</button>
              <button type="button" style={pill} onClick={() => savePathFit("too_much")}>🪶 Make it gentler</button>
            </div>
          </div>
        )}

        {goldMemoryUnlocked && (
          <div className="pl-care-tonight">
            <div className="moon">🌙 TONIGHT</div>
            <div style={{ marginTop: 5, fontSize: 12.5, lineHeight: 1.45 }}>{sleep.text}</div>
            {sleep.tool && <>
              <button type="button" className="pl-care-soft-btn" onClick={() => { props.setCareSection("sleep"); startSleep(sleep.tool.id); }} style={{ marginTop: 9 }}>Try {sleep.tool.title}</button>
              {sleep.count >= 2 && <details style={{ marginTop: 5 }}><summary style={{ minHeight: 40, display: "flex", alignItems: "center", cursor: "pointer", color: "#8A6A95", fontSize: 10.5, fontWeight: 850 }}>Why this?</summary><div style={{ fontSize: 10.2, lineHeight: 1.45 }}>{sleepFit?.confidence === "strong" && sleepFit.contextual >= 2 ? "This has helped on nights with a similar check-in." : `You marked this helpful ${sleep.count} times.`}</div></details>}
            </>}
          </div>
        )}

        <div className="plushcare-library pl-care-tabs">
          <ExistingCarePanel {...props} open={true} isMamaCornerProfile={false} openCareSession={startCare} setSleepToolOpen={startSleep} />
        </div>
      </section>
    </div>
  );
}
