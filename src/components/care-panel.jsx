import { MamasCorner } from "./baby-mode.jsx";
import { CarePanel as ExistingCarePanel } from "./care-panel-existing.jsx";

const shellCard = {
  borderRadius: 14,
  border: "1px solid #CFE8E1",
  background: "linear-gradient(145deg,#F3FFFB,#FFF8FC)",
  boxShadow: "0 4px 14px rgba(49,140,121,.06)",
};

function bestHelpfulTool(history, tools) {
  const useful = (Array.isArray(history) ? history : []).filter((entry) => ["helped", "a_little"].includes(entry.outcome));
  if (!useful.length) return null;
  const counts = new Map();
  useful.forEach((entry) => counts.set(entry.session_id, (counts.get(entry.session_id) || 0) + 1));
  const bestId = Array.from(counts.entries()).sort((a, b) => b[1] - a[1])[0]?.[0];
  const tool = (Array.isArray(tools) ? tools : []).find((entry) => entry.id === bestId);
  return tool ? { tool, count: counts.get(bestId) || 1 } : null;
}

function SituationButton({ option, selected, onClick }) {
  return <button type="button" aria-pressed={selected} onClick={onClick} style={{ minHeight: 58, padding: "9px 10px", borderRadius: 12, border: selected ? "2px solid #4A9D8B" : "1px solid #CFE8E1", background: selected ? "#F0FFF9" : "rgba(255,255,255,.88)", color: "#4F625D", textAlign: "left", fontWeight: 850, fontSize: 11.4, lineHeight: 1.3, cursor: "pointer", boxShadow: selected ? "0 3px 9px rgba(49,140,121,.08)" : "none" }}><span aria-hidden="true" style={{ fontSize: 18, marginRight: 6 }}>{option.icon}</span>{option.label}</button>;
}

export function CarePanel(props) {
  if (!props.open) return null;
  const { COMFORT_TOOLS } = window.PlushLifeContent;
  const [selectedSituationId, setSelectedSituationId] = React.useState(null);
  const [libraryOpen, setLibraryOpen] = React.useState(props.careSection !== "quick");
  const options = Array.isArray(props.HELP_ME_NOW_OPTIONS) ? props.HELP_ME_NOW_OPTIONS : [];
  const visibleOptions = options.slice(0, props.careSituationsExpanded ? options.length : 4);
  const selectedSituation = options.find((option) => option.id === selectedSituationId) || null;
  const recommendedTool = selectedSituation ? COMFORT_TOOLS.find((tool) => tool.id === selectedSituation.tool) || null : null;
  const helpedBefore = bestHelpfulTool(props.careSessionHistory, COMFORT_TOOLS);

  React.useEffect(() => {
    if (props.careSection !== "quick") setLibraryOpen(true);
  }, [props.careSection]);

  const chooseSituation = (option) => {
    setSelectedSituationId(option.id);
    props.setCareMessage(option.next);
  };

  return <div data-plushcare-redesign="true" style={{ marginBottom: 18, display: "grid", gap: 9 }}>
    <section style={{ ...shellCard, padding: "13px 14px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, flexWrap: "wrap" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 10.2, letterSpacing: ".14em", color: "#318C79", fontWeight: 900 }}>{props.babyMode ? "🧸 LITTLE COMFORT CORNER" : "♥ PLUSHCARE"}</div>
          <div style={{ marginTop: 3, fontSize: 17.5, lineHeight: 1.18, color: "#4F405C", fontWeight: 900 }}>{props.babyMode ? "What does my little self need?" : "What would help right now?"}</div>
        </div>
        <button type="button" onClick={() => props.setCheckInPopupOpen(true)} style={{ minHeight: 44, padding: "7px 10px", borderRadius: 10, border: "1px solid #73B7A8", background: "white", color: "#318C79", fontWeight: 900, fontSize: 10.7, cursor: "pointer", flexShrink: 0 }}>{props.babyMode ? `${props.babyCaregiverName} Check-In` : "Update check-in"}</button>
      </div>
      <div style={{ marginTop: 5, fontSize: 10.8, lineHeight: 1.45, color: "#607A73" }}>{props.babyMode ? "Pick what feels closest. We will choose one small thing together." : "Pick what feels closest. PlushLife will choose one small next step instead of giving you a whole menu."}</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 7, marginTop: 10 }}>
        {visibleOptions.map((option) => <SituationButton key={option.id} option={option} selected={selectedSituationId === option.id} onClick={() => chooseSituation(option)} />)}
      </div>
      <button type="button" onClick={() => props.setCareSituationsExpanded((expanded) => !expanded)} aria-expanded={props.careSituationsExpanded} style={{ marginTop: 7, minHeight: 44, padding: "6px 9px", borderRadius: 9, border: "1px solid #73B7A8", background: "white", color: "#318C79", fontWeight: 900, fontSize: 10.5, cursor: "pointer" }}>{props.careSituationsExpanded ? "Show fewer situations" : "Show more situations"}</button>

      {selectedSituation && <div aria-live="polite" style={{ marginTop: 9, padding: "10px 11px", borderRadius: 12, background: "#FFFFFFD9", border: "1px solid #CFE8E1" }}>
        <div style={{ fontSize: 9.5, letterSpacing: ".11em", fontWeight: 900, color: "#318C79" }}>✨ BEST NEXT THING</div>
        <div style={{ marginTop: 4, fontSize: 12.1, fontWeight: 900, color: "#4F625D" }}>{recommendedTool ? `${recommendedTool.icon} ${recommendedTool.name}` : `${selectedSituation.icon} One small care step`}</div>
        <div style={{ marginTop: 4, fontSize: 10.6, lineHeight: 1.43, color: "#607A73" }}>{selectedSituation.next}</div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 8 }}>
          <button type="button" onClick={() => props.openCareSession(selectedSituation.tool)} style={{ minHeight: 44, padding: "7px 11px", borderRadius: 10, border: 0, background: "linear-gradient(135deg,#52A792,#3E8C7D)", color: "white", fontWeight: 900, fontSize: 10.7, cursor: "pointer" }}>{props.babyMode ? "🧸 Do this with me" : "Start this"}</button>
          <button type="button" onClick={() => setLibraryOpen(true)} style={{ minHeight: 44, padding: "7px 10px", borderRadius: 10, border: "1px solid #BFDCCF", background: "white", color: "#52736B", fontWeight: 850, fontSize: 10.3, cursor: "pointer" }}>See other tools</button>
        </div>
      </div>}
    </section>

    {helpedBefore && <section style={{ ...shellCard, padding: "10px 11px", background: "linear-gradient(145deg,#F8F2FF,#FFFFFF)", borderColor: "#E3D2EC" }}>
      <div style={{ display: "flex", gap: 9, alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ minWidth: 0 }}><div style={{ fontSize: 10.6, fontWeight: 900, color: "#76558A" }}>💜 This helped you before</div><div style={{ marginTop: 2, fontSize: 10.3, lineHeight: 1.38, color: "#806B8D" }}><strong>{helpedBefore.tool.name}</strong>{helpedBefore.count > 1 ? ` helped ${helpedBefore.count} times you checked.` : " was helpful the last time you checked."}</div></div>
        <button type="button" onClick={() => props.openCareSession(helpedBefore.tool.id)} style={{ minHeight: 44, padding: "7px 9px", borderRadius: 10, border: "1px solid #D7BFE4", background: "white", color: "#76558A", fontWeight: 900, fontSize: 10.2, cursor: "pointer", flexShrink: 0 }}>Use again</button>
      </div>
    </section>}

    {props.isMamaCornerProfile && <details open={props.careExtraSupportOpen} onToggle={(event) => props.setCareExtraSupportOpen(event.currentTarget.open)} style={{ borderRadius: 13, border: "1px solid #E6D4F2", background: "rgba(255,255,255,.72)", padding: "8px 10px" }}>
      <summary style={{ minHeight: 44, display: "flex", alignItems: "center", color: "#76558A", fontWeight: 900, fontSize: 10.8, cursor: "pointer" }}>🧸 More cozy support</summary>
      <div style={{ marginTop: 7 }}><MamasCorner userId={props.user.id} caregiverName={props.babyCaregiverName} parentVoice={props.preferences.baby_voice === "fatherly" ? "fatherly" : "motherly"} incompleteTasks={props.rows.filter((row) => !props.viewDone[row.key] && !row.isBonus)} onConfirmTask={(taskKey) => props.toggle(taskKey)} supabase={props.supabase} /></div>
    </details>}

    <details open={libraryOpen} onToggle={(event) => setLibraryOpen(event.currentTarget.open)} style={{ borderRadius: 13, border: "1px solid #E6D4F2", background: "rgba(255,255,255,.7)", padding: "8px 9px" }}>
      <summary style={{ minHeight: 44, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, color: "#76558A", fontWeight: 900, fontSize: 10.8, cursor: "pointer" }}><span>🧰 Browse all care tools</span><span style={{ fontSize: 9.4, color: "#9B83A8", fontWeight: 800 }}>Calm · Paths · Sleep</span></summary>
      <div className="plushcare-library" style={{ marginTop: 7 }}>
        <style>{`.plushcare-library > div > :first-child{display:none!important}.plushcare-library > div{gap:9px!important;margin-bottom:0!important}.plushcare-library [role="tablist"]{margin-top:0!important}`}</style>
        <ExistingCarePanel {...props} open={true} isMamaCornerProfile={false} />
      </div>
    </details>
  </div>;
}
