import { HabitTypeIcon } from "./shared.jsx";
import { BabyModeCareSuite } from "./baby-mode.jsx";

const softButton = {
  padding: "10px 12px",
  borderRadius: 13,
  border: "1px solid #E2CDEB",
  background: "rgba(255,255,255,.9)",
  color: "#76558A",
  fontWeight: 900,
  cursor: "pointer",
};

export function BabyToday({
  open,
  period,
  nextStepTask,
  nextStepHint,
  toggle,
  pickEasierSuggestion,
  selectDayType,
  restDatesSet,
  toggleRestToday,
  rows = [],
  viewDone = {},
  openTaskManager,
  openJournalForSelectedDate,
  activityDaysTotal = 0,
  careDaysTotal = 0,
  babyCaregiverName = "Mommy",
  trackerProfile,
  setCareSection,
  goToDashboard,
  pct = 0,
}) {
  const [showMore, setShowMore] = React.useState(false);
  if (!open) return null;

  const waiting = rows.filter((row) => !viewDone[row.key] && !row.isBonus);
  const visible = waiting.slice(0, 4);
  const resting = restDatesSet?.has?.(period?.date);
  const comfortItem = trackerProfile?.comfort_item || trackerProfile?.comfort_item_name || "";

  const openCare = () => {
    setCareSection?.("quick");
    goToDashboard?.("care");
  };

  return (
    <div className="baby-today-simple" style={{ display: "grid", gap: 13, marginBottom: 18 }}>
      <section style={{ padding: 16, borderRadius: 20, background: "linear-gradient(145deg,#FFF8FD,#F4FBFF)", border: "1px solid #E3C9EC", boxShadow: "0 8px 24px rgba(118,85,138,.08)" }}>
        <div style={{ fontSize: 11, letterSpacing: ".14em", fontWeight: 900, color: "#A65DC1" }}>🍼 MY TINY THING</div>
        {nextStepTask ? (
          <>
            <div style={{ marginTop: 7, fontSize: 20, lineHeight: 1.28, fontWeight: 900, color: "#4F405C" }}>
              {nextStepTask.sourceTask && <HabitTypeIcon task={nextStepTask.sourceTask} />}{nextStepTask.label}
            </div>
            {nextStepHint?.key === nextStepTask.key && <div style={{ marginTop: 7, fontSize: 12, lineHeight: 1.45, color: "#806B8D" }}>🌱 {nextStepHint.text}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>
              <button type="button" onClick={() => toggle(nextStepTask.key)} style={{ ...softButton, border: 0, background: "#A65DC1", color: "white" }}>✓ Tuck it in</button>
              <button type="button" onClick={() => pickEasierSuggestion?.(nextStepTask.key)} style={softButton}>🌱 Make it tinier</button>
            </div>
          </>
        ) : (
          <div style={{ marginTop: 7, fontSize: 14, lineHeight: 1.5, color: "#6B5A7D" }}>Everything important is tucked in. Resting and playing count too. 🧸</div>
        )}
        <div style={{ display: "flex", gap: 7, marginTop: 10, flexWrap: "wrap" }}>
          <button type="button" onClick={() => selectDayType?.("soft")} style={{ ...softButton, padding: "8px 10px", fontSize: 11.5 }}>🌼 Soft day</button>
          <button type="button" onClick={() => selectDayType?.("tiny")} style={{ ...softButton, padding: "8px 10px", fontSize: 11.5 }}>🌱 Tiny day</button>
          <button type="button" onClick={openCare} style={{ ...softButton, padding: "8px 10px", fontSize: 11.5 }}>♥ I need comfort</button>
        </div>
      </section>

      {resting && <section style={{ padding: "11px 13px", borderRadius: 15, background: "#EEF9F6", border: "1px solid #BFE5D2", color: "#3E746A" }}>
        <div style={{ fontWeight: 900, fontSize: 12.5 }}>🌴 Today is a rest day.</div>
        <div style={{ marginTop: 3, fontSize: 11.5, lineHeight: 1.45 }}>Nothing is required and your progress is safe.</div>
        <button type="button" onClick={toggleRestToday} style={{ ...softButton, marginTop: 7, padding: "7px 9px", fontSize: 11 }}>End rest day</button>
      </section>}

      <section style={{ padding: 15, borderRadius: 18, background: "rgba(255,255,255,.82)", border: "1px solid #E6D4F2" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: ".13em", fontWeight: 900, color: "#A65DC1" }}>🧸 LITTLE JOBS</div>
            <div style={{ marginTop: 3, fontSize: 11.5, color: "#8C6B9E" }}>Only a few at a time. No giant list.</div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 900, color: "#8C6B9E" }}>{Math.round(Number(pct) || 0)}%</div>
        </div>
        <div style={{ display: "grid", gap: 7, marginTop: 10 }}>
          {visible.map((task) => (
            <button key={task.key} type="button" onClick={() => toggle(task.key)} style={{ display: "grid", gridTemplateColumns: "24px 1fr", gap: 8, alignItems: "center", padding: "11px 12px", borderRadius: 13, border: "1px solid #E2D5E8", background: "white", color: "#5B4B6B", textAlign: "left", cursor: "pointer" }}>
              <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: "50%", border: "2px solid #B67AC8", display: "grid", placeItems: "center" }}>○</span>
              <span style={{ fontSize: 13, lineHeight: 1.35, fontWeight: 850 }}>{task.label}</span>
            </button>
          ))}
          {!visible.length && <div style={{ padding: "12px 2px", color: "#806B8D", fontSize: 12.5 }}>All tucked in. 💜</div>}
        </div>
        <div style={{ display: "flex", gap: 7, marginTop: 10, flexWrap: "wrap" }}>
          {waiting.length > 4 && <button type="button" onClick={() => openTaskManager?.()} style={softButton}>Show all {waiting.length} little jobs</button>}
          <button type="button" onClick={() => openTaskManager?.()} style={softButton}>✏️ Change my little jobs</button>
        </div>
      </section>

      <BabyModeCareSuite
        date={period?.date || ""}
        todayDone={rows.filter((row) => !!viewDone[row.key] && !row.isBonus).length}
        todayTotal={rows.filter((row) => !row.isBonus).length}
        activityDays={activityDaysTotal}
        careDays={careDaysTotal}
        caregiverName={babyCaregiverName}
        comfortItemName={comfortItem}
        littleJobs={waiting}
        onCompleteTask={toggle}
        onManageTasks={openTaskManager}
        onOpenJournal={openJournalForSelectedDate}
      />

      <section style={{ borderRadius: 17, background: "rgba(255,255,255,.72)", border: "1px solid #E6D4F2", overflow: "hidden" }}>
        <button type="button" onClick={() => setShowMore((value) => !value)} aria-expanded={showMore} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "13px 14px", border: 0, background: "transparent", color: "#76558A", fontWeight: 900, cursor: "pointer" }}>
          <span>🗝 More for grown-up me</span><span aria-hidden="true">{showMore ? "▾" : "›"}</span>
        </button>
        {showMore && <div style={{ padding: "0 12px 12px", display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 7 }}>
          <button type="button" onClick={() => goToDashboard?.("week")} style={softButton}>🗓 Planner</button>
          <button type="button" onClick={() => goToDashboard?.("progress")} style={softButton}>📈 Progress</button>
          <button type="button" onClick={() => openJournalForSelectedDate?.()} style={softButton}>📖 Journal</button>
          <button type="button" onClick={() => openTaskManager?.()} style={softButton}>⚙️ Task setup</button>
          <button type="button" onClick={openCare} style={{ ...softButton, gridColumn: "1 / -1" }}>♥ PlushCare & support tools</button>
        </div>}
      </section>
    </div>
  );
}
