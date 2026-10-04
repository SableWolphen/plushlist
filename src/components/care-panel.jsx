import { CozySpace } from "./cozy-space.jsx";
import { CareHistory } from "./care-history.jsx";
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
import { CarePanel as ExistingCarePanel } from "./care-panel-existing.jsx";
import { EXTRA_PLUSH_PATHS } from "../plush-paths-extra.js";
import { hasGoldFeature } from "../plush-gold.js";
import { addCaringDay, localDay, pathAdaptation, recordMoment, recordPathFeedback, sleepMemory, supportMemory } from "../plush-memory.js";
import { beginRecommendation, profileContext, recommendationFit, recordRecommendationOutcome, syncSessionOutcomes } from "../plush-profile.js";

const card = {
  borderRadius: 24,
  border: "1px solid var(--pl-theme-line,#E9DDF6)",
  background: "linear-gradient(145deg,rgba(255,255,255,.95),rgba(255,248,252,.92))",
  boxShadow: "0 10px 28px rgba(101,63,115,.055)",
};

const pill = {
  minHeight: 42,
  padding: "8px 12px",
  borderRadius: 999,
  border: "1px solid var(--pl-theme-line,#E9DDF6)",
  background: "var(--pl-theme-surface,#FFF9FD)",
  color: "var(--pl-theme-ink,#7B548A)",
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
  const [libraryOpen, setLibraryOpen] = React.useState(false);
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
  const breathTool = COMFORT_TOOLS.find((tool) => /breath/i.test(String(tool?.id || "") + " " + String(tool?.name || "") + " " + String(tool?.title || ""))) || COMFORT_TOOLS[0] || null;
  const calmTool = COMFORT_TOOLS.find((tool) => /calm|ground|reset|soothe/i.test(String(tool?.id || "") + " " + String(tool?.name || "") + " " + String(tool?.title || ""))) || breathTool;

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
      <section className="pl-reference-care-launchers" aria-label="Care shortcuts">
        <button type="button" onClick={() => props.setCheckInPopupOpen?.(true)}><span aria-hidden="true">💗</span><span><strong>Daily check-in</strong><small>How are you feeling today?</small></span><span aria-hidden="true">›</span></button>
        <button type="button" onClick={() => props.openTodayJournal?.()}><span aria-hidden="true">📝</span><span><strong>Journal</strong><small>Write about your day.</small></span><span aria-hidden="true">›</span></button>
        <button type="button" onClick={() => breathTool && startCare(breathTool.id)}><span aria-hidden="true">🌿</span><span><strong>Breathe</strong><small>Short calming exercises.</small></span><span aria-hidden="true">›</span></button>
        <button type="button" onClick={() => calmTool && startCare(calmTool.id)}><span aria-hidden="true">🫶</span><span><strong>Calmness pass</strong><small>Simpler support, less clutter.</small></span><span aria-hidden="true">›</span></button>
      </section>
      <style>{`
        .pl-care-shell{display:grid;gap:6px;margin-bottom:8px;padding:2px 0 12px}
        .pl-care-card,.pl-care-memory{position:relative;overflow:hidden;border:1px solid rgba(222,190,232,.72);border-radius:26px;background:linear-gradient(145deg,rgba(255,250,253,.98),rgba(247,240,255,.95));box-shadow:0 12px 30px rgba(104,71,132,.09),inset 0 1px 0 rgba(255,255,255,.9);padding:15px}
        .pl-care-card:before,.pl-care-memory:before{content:"";position:absolute;width:110px;height:110px;border-radius:50%;right:-48px;top:-56px;background:radial-gradient(circle,rgba(243,183,229,.26),rgba(218,196,255,.12) 58%,transparent 70%);pointer-events:none}
        .pl-care-card:after{content:"";position:absolute;width:56px;height:56px;border-radius:50%;left:-26px;bottom:-25px;background:rgba(199,225,255,.16);pointer-events:none}
        .pl-care-kicker{position:relative;font-size:9px;letter-spacing:.16em;font-weight:950;color:#B34FBA;text-transform:uppercase}
        .pl-care-title{position:relative;margin-top:4px;font-size:18px;line-height:1.1;font-weight:950;color:#4B3158;letter-spacing:-.025em}
        .pl-care-copy{position:relative;margin-top:5px;font-size:10.6px;line-height:1.42;color:#7C6784}
        .pl-care-feelings{position:relative;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px}
        .pl-care-feeling{min-height:58px;padding:9px 10px;border-radius:19px;border:1px solid rgba(226,205,234,.9);background:linear-gradient(145deg,#FFFDFE,#FFF7FC);color:#5C4765;text-align:left;font-weight:900;font-size:10.5px;line-height:1.18;cursor:pointer;box-shadow:0 6px 16px rgba(117,79,135,.055);display:flex;align-items:center;gap:8px;transition:transform .16s ease,box-shadow .16s ease,border-color .16s ease}
        .pl-care-feeling:nth-child(2){background:linear-gradient(145deg,#FBF9FF,#F2F4FF)}
        .pl-care-feeling:nth-child(3){background:linear-gradient(145deg,#FAFFF9,#F1FBF4)}
        .pl-care-feeling:nth-child(4){background:linear-gradient(145deg,#FFFDF7,#FFF4E8)}
        .pl-care-feeling:active{transform:scale(.985)}
        .pl-care-feeling.selected{border-color:#CC79D8;background:linear-gradient(145deg,#FFF2FB,#F1E9FF);box-shadow:0 0 0 3px rgba(200,111,215,.11),0 8px 18px rgba(129,81,150,.08)}
        .pl-care-feeling-icon{flex:0 0 auto;display:grid;place-items:center;width:31px;height:31px;border-radius:12px;background:rgba(255,255,255,.74);font-size:18px;box-shadow:inset 0 0 0 1px rgba(224,205,232,.52)}
        .pl-care-checkin{position:relative;flex-shrink:0;min-height:44px;padding:7px 11px;border-radius:999px;border:1px solid #E3CBE9;background:linear-gradient(145deg,#FFF9FD,#F8F0FF);color:#8A4F98;font-weight:950;font-size:10.5px;cursor:pointer;box-shadow:0 5px 12px rgba(118,77,135,.05)}
        .pl-care-soft-btn{min-height:44px;padding:8px 12px;border-radius:16px;border:1px solid #E4CEE9;background:linear-gradient(145deg,#FFF9FD,#F8F1FF);color:#855391;font-weight:900;font-size:10.2px;cursor:pointer;box-shadow:0 5px 12px rgba(119,79,137,.045)}
        .pl-care-primary{min-height:44px;padding:8px 13px;border-radius:16px;border:0;background:linear-gradient(135deg,#C85FD3,#E781BF);color:white;font-weight:950;font-size:10.4px;cursor:pointer;box-shadow:0 9px 20px rgba(190,92,203,.2)}
        .pl-care-reco{position:relative;margin-top:9px;padding:11px;border-radius:20px;background:linear-gradient(145deg,#FFF1FA,#F4EEFF);border:1px solid #E1CBE9;box-shadow:inset 0 1px 0 rgba(255,255,255,.7)}
        .pl-care-memory{padding:13px 14px;background:linear-gradient(145deg,#FFF7FC,#F4F0FF)}
        .pl-care-memory strong{color:#704080}
        .pl-care-memory details,.pl-care-tonight details{margin-top:7px!important;border:0!important;border-radius:14px!important;background:rgba(255,255,255,.44)!important;overflow:hidden}
        .pl-care-memory summary,.pl-care-tonight summary{padding:0 10px!important;background:transparent!important;border:0!important;box-shadow:none!important}
        .pl-care-memory details>div,.pl-care-tonight details>div{padding:0 10px 10px!important}
        .pl-care-extra{padding:2px 4px;border:0;background:transparent;box-shadow:none}
        .pl-care-extra>summary{border-radius:14px;background:rgba(255,255,255,.34)}
        .pl-care-extra>div{padding:5px 2px 2px}
        .pl-care-spaces{padding:4px 0 0;border-radius:0;border:0;background:transparent;box-shadow:none}
        .pl-care-tonight{margin:9px 0;padding:11px 12px;border-radius:20px;background:linear-gradient(145deg,#F4EEFF,#FFF4FB);border:1px solid #DDC8EA;color:#654D73;box-shadow:0 7px 18px rgba(107,74,134,.045)}
        .pl-care-tonight .moon{font-size:9px;letter-spacing:.13em;font-weight:950;color:#A657B9}
        .pl-care-tabs.plushcare-library>div> :first-child{display:none!important}
        .plushcare-library>div{gap:8px!important;margin-bottom:0!important}
        .plushcare-library [role="tablist"]{margin-top:2px!important;background:rgba(255,248,253,.62)!important;border:1px solid #E5D3EA!important;border-radius:20px!important;padding:4px!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.8)!important}
        .plushcare-library [role="tab"]{border-radius:16px!important;min-height:44px!important;color:#77547F!important;font-size:10px!important}
        .plushcare-library [role="tab"][aria-selected="true"]{background:linear-gradient(145deg,#FFF7FD,#F0E7FA)!important;border-color:#CD82D8!important;box-shadow:0 5px 14px rgba(154,80,189,.09)!important}
        .plushcare-library .pl-care-library-panel{border-radius:22px!important;border:1px solid rgba(230,210,235,.82)!important;background:linear-gradient(145deg,rgba(255,253,254,.95),rgba(251,244,255,.9))!important;box-shadow:0 8px 20px rgba(101,63,115,.05)!important}
        .plushcare-library .pl-care-library-panel button{min-height:44px;padding:8px;border-radius:13px}
        .plushcare-library .pl-care-library-panel .pl-care-tool{min-height:54px!important;background:linear-gradient(145deg,#FFFDFE,#FFF8FC);border-color:#EAD7EE}

        .plushcare-library .pl-care-library-panel h2,.plushcare-library .pl-care-library-panel h3{margin-top:0!important;margin-bottom:4px!important;color:#5F4568!important}
        .plushcare-library .pl-care-library-panel p{margin-top:3px!important;margin-bottom:6px!important;line-height:1.38!important;color:#806D87!important}
        @media(max-width:520px){
          .pl-care-shell{gap:6px}.pl-care-card,.pl-care-memory{padding:10px;border-radius:16px}
          .pl-care-title{margin-top:2px;font-size:15.5px;line-height:1.2}.pl-care-copy{font-size:10.2px}
          .pl-care-feelings{gap:7px;margin-top:10px}.pl-care-feeling{min-height:46px;padding:8px 9px;font-size:10.2px;border-radius:13px}
          .pl-care-feeling-icon{width:29px;height:29px;font-size:17px;border-radius:11px}
          .pl-care-spaces{padding:5px 1px 0}.pl-care-checkin,.pl-care-soft-btn,.pl-care-primary{font-size:9.8px}
          .pl-care-tonight{padding:10px 11px;border-radius:18px}.plushcare-library .pl-care-tool{min-height:50px!important}
          .plushcare-library .pl-care-library-panel{padding:10px!important;border-radius:16px!important}
          .plushcare-library [role="tablist"]{border-radius:16px!important}
          .plushcare-library [role="tab"]{border-radius:12px!important}
        }
      `}</style>

      <details className="pl-design-card" style={{ marginBottom: 0 }}>
        <summary style={{ minHeight: 44, display: "list-item", alignContent: "center", cursor: "pointer", fontWeight: 900, color: "var(--pl-theme-ink,#5B4B6B)" }}>🧸 My Cozy Space</summary>
        <div style={{ paddingTop: 8 }}>
          <CozySpace comfortItem={props.comfortItem} rows={props.rows} viewDone={props.viewDone} onReset={props.onReset} onSupport={props.onOpenSupport} onSettings={props.onOpenSettings} onSound={props.toggleSoundscape} onReminderTime={props.onReminderTime} soundscapes={window.PlushLifeContent.SOUNDSCAPES} notes={props.supportNotes} />
        </div>
      </details>
      <section className="pl-care-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
          <div>

            <div className="pl-care-title">What would feel nicest right now?</div>
          </div>
          <button type="button" className="pl-care-checkin" onClick={() => props.setCheckInPopupOpen(true)}>
            {props.babyMode ? `${props.babyCaregiverName} check-in` : "Check in"}
          </button>
        </div>
        <div className="pl-care-copy">Care is for the moment you’re in. Pick one feeling and we’ll find one small step; the bigger tool library can wait.</div>

        <div className="pl-care-feelings">
          {visibleOptions.map((option) => <SituationButton key={option.id} option={option} selected={selectedSituationId === option.id} onClick={() => chooseSituation(option)} />)}
        </div>

        <button type="button" className="pl-care-soft-btn" onClick={() => props.setCareSituationsExpanded((expanded) => !expanded)} aria-expanded={props.careSituationsExpanded} style={{ marginTop: 9 }}>
          {props.careSituationsExpanded ? "Show fewer" : "More ways I might feel"}
        </button>

        {selectedSituation && (
          <div className="pl-care-reco" aria-live="polite">
            <div className="pl-care-kicker">✨ A SOFT PLACE TO START</div>
            <div style={{ marginTop: 5, fontSize: 15, fontWeight: 950, color: "var(--pl-theme-ink,#533960)" }}>
              {recommendedTool ? `${recommendedTool.icon} ${recommendedTool.name}` : `${selectedSituation.icon} One gentle step`}
            </div>
            <div className="pl-care-copy">{selectedSituation.next}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
              <button type="button" className="pl-care-primary" onClick={() => startCare(selectedSituation.tool)}>Start now</button>
              <button type="button" className="pl-care-soft-btn" onClick={() => { props.setCareSection("quick"); setLibraryOpen(true); }}>🌿 Open PlushCalm</button>
            </div>
          </div>
        )}
      </section>

      <details className="pl-care-history-door pl-design-card">
        <summary>Your history <span>Check-ins & journals →</span></summary>
        <CareHistory {...props} />
      </details>

      {goldMemoryUnlocked && memory.tool && (
        <section data-actionable-care-recommendation="true" className="pl-care-memory">
          <div className="pl-care-kicker">💗 SOMETHING THAT HELPED BEFORE</div>
          <div style={{ marginTop: 5, fontSize: 15, fontWeight: 950, color: "var(--pl-theme-ink,#553B61)" }}>{memory.tool.icon} {memory.tool.name}</div>
          <div className="pl-care-copy">Want to use this cozy reset again?</div>
          <button type="button" className="pl-care-primary" onClick={() => startCare(memory.tool.id)} style={{ marginTop: 9 }}>Try it again</button>
          {memory.count >= 2 && <details style={{ marginTop: 6 }}><summary style={{ minHeight: 40, display: "flex", alignItems: "center", cursor: "pointer", color: "var(--pl-theme-muted,#8A6A95)", fontSize: 10.5, fontWeight: 850 }}>Why this?</summary><div style={{ fontSize: 10.2, lineHeight: 1.45, color: "var(--pl-theme-muted,#8C7A96)" }}>You marked this helpful {memory.count} times{careFit?.confidence === "strong" && careFit.contextual >= 2 ? " in moments like this" : ""}.</div></details>}
        </section>
      )}


      <section aria-label="PlushCare main spaces" className="pl-care-spaces">


        {goldMemoryUnlocked && props.careSection === "paths" && activePath && (
          <div className="pl-care-reco" data-adaptive-plushpath="true">
            <div className="pl-care-kicker">🗺️ YOUR CURRENT PLUSHPATH</div>
            <div style={{ marginTop: 5, fontWeight: 950, color: "var(--pl-theme-ink,#5D4468)" }}>{activePath.icon} {activePath.title}</div>
            <div className="pl-care-copy">{pathCoach?.text}</div>
            <div style={{ display: "flex", gap: 7, flexWrap: "wrap", marginTop: 8 }}>
              <button type="button" style={pill} onClick={() => savePathFit("helped")}>💜 Helped</button>
              <button type="button" style={pill} onClick={() => savePathFit("neutral")}>🙂 Not sure</button>
              <button type="button" style={pill} onClick={() => savePathFit("too_much")}>🪶 Make it gentler</button>
            </div>
          </div>
        )}

        {goldMemoryUnlocked && props.careSection === "sleep" && (
          <div className="pl-care-tonight">
            <div className="moon">🌙 TONIGHT</div>
            <div style={{ marginTop: 5, fontSize: 12.5, lineHeight: 1.45 }}>{sleep.text}</div>
            {sleep.tool && <>
              <button type="button" className="pl-care-soft-btn" onClick={() => { props.setCareSection("sleep"); startSleep(sleep.tool.id); }} style={{ marginTop: 9 }}>Try {sleep.tool.title}</button>
              {sleep.count >= 2 && <details style={{ marginTop: 5 }}><summary style={{ minHeight: 40, display: "flex", alignItems: "center", cursor: "pointer", color: "var(--pl-theme-muted,#8A6A95)", fontSize: 10.5, fontWeight: 850 }}>Why this?</summary><div style={{ fontSize: 10.2, lineHeight: 1.45 }}>{sleepFit?.confidence === "strong" && sleepFit.contextual >= 2 ? "This has helped on nights with a similar check-in." : `You marked this helpful ${sleep.count} times.`}</div></details>}
            </>}
          </div>
        )}

        <button type="button" className="pl-care-soft-btn" onClick={props.onOpenSupport}>My support circle →</button>
        <details className="pl-care-library-door pl-design-card" open={libraryOpen} onToggle={event => setLibraryOpen(event.currentTarget.open)}>
          <summary>Calm, paths & sleep <span>Browse care tools →</span></summary>
        <div className="plushcare-library pl-care-tabs">
          <ExistingCarePanel {...props} open={true} libraryOnly={true} openCareSession={startCare} setSleepToolOpen={startSleep} />
        </div>
        </details>
      </section>
    </div>
  );
}
