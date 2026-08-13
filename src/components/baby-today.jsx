import { HabitTypeIcon } from "./shared.jsx";
import { BabyModeCareSuite } from "./baby-mode.jsx";
import { BabyHabitAnchor } from "./habit-intelligence.jsx";
import { CompletedTaskArea } from "./completed-task-flow.jsx";

const softButton = {
  minHeight: 44,
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
  recentlyCompletedKeys = [],
  completedLingerKeys = [],
  openTaskManager,
  openJournalForSelectedDate,
  activityDaysTotal = 0,
  careDaysTotal = 0,
  babyCaregiverName = "Mommy",
  trackerProfile,
  selectedSchedule,
  selectedScheduleExceptionEntries = [],
  scheduleDayId,
  setCareSection,
  goToDashboard,
  pct = 0,
}) {
  const [showMore, setShowMore] = React.useState(false);
  const [showAllLittleJobs, setShowAllLittleJobs] = React.useState(false);
  if (!open) return null;

  const allLittleJobs = rows.filter((row) => !row.isBonus);
  const lingering = new Set(recentlyCompletedKeys || []);
  const waiting = allLittleJobs.filter((row) => !viewDone[row.key] || lingering.has(row.key));
  const visible = showAllLittleJobs ? waiting : waiting.slice(0, 3);
  const completedCount = allLittleJobs.filter((row) => !!viewDone[row.key] && !lingering.has(row.key)).length;
  const resting = restDatesSet?.has?.(period?.date);
  const comfortItem = trackerProfile?.comfort_item || trackerProfile?.comfort_item_name || "";
  const { legacyScheduleToEntries, formatTime12 } = window.PlushLifeSchedule || {};
  const baseScheduleEntries = selectedSchedule?.entries?.length
    ? selectedSchedule.entries
    : (legacyScheduleToEntries ? legacyScheduleToEntries(selectedSchedule) : []);
  const babyScheduleEntries = [...(baseScheduleEntries || []), ...(selectedScheduleExceptionEntries || [])]
    .filter((entry) => entry && (entry.text || entry.label || entry.title || entry.time))
    .sort((a, b) => String(a.time || "99:99").localeCompare(String(b.time || "99:99")));

  const openCare = () => {
    setCareSection?.("quick");
    goToDashboard?.("care");
  };

  const littleJobStyle = (done) => ({
    minHeight: 48,
    display: "grid",
    gridTemplateColumns: "24px 1fr",
    gap: 8,
    alignItems: "center",
    padding: "11px 12px",
    borderRadius: 13,
    border: "1px solid #E2D5E8",
    background: done ? "#FAF6FC" : "white",
    color: done ? "#A081AD" : "#5B4B6B",
    textAlign: "left",
    cursor: "pointer",
  });

  return (
    <div className="baby-today-simple" style={{ display: "grid", gap: 9, marginBottom: 14 }}>
      <section style={{ padding: 13, borderRadius: 17, background: "linear-gradient(145deg,#FFF8FD,#F4FBFF)", border: "1px solid #E3C9EC", boxShadow: "0 6px 18px rgba(118,85,138,.06)" }}>
        <div style={{ fontSize: 11, letterSpacing: ".14em", fontWeight: 900, color: "#A65DC1" }}>🍼 MY TINY THING</div>
        {nextStepTask ? (
          <>
            <div style={{ marginTop: 5, fontSize: 18, lineHeight: 1.25, fontWeight: 900, color: "#4F405C" }}>
              {nextStepTask.sourceTask && <HabitTypeIcon task={nextStepTask.sourceTask} />}{nextStepTask.label}
            </div>
            {nextStepHint?.key === nextStepTask.key && <div style={{ marginTop: 7, fontSize: 12, lineHeight: 1.45, color: "#806B8D" }}>🌱 {nextStepHint.text}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginTop: 9 }}>
              <button type="button" onClick={() => toggle(nextStepTask.key)} style={{ ...softButton, border: 0, background: "#A65DC1", color: "white" }}>✓ Tuck it in</button>
              <button type="button" onClick={() => pickEasierSuggestion?.(nextStepTask.key)} style={softButton}>🌱 Make it tinier</button>
            </div>
          </>
        ) : (
          <div style={{ marginTop: 7, fontSize: 14, lineHeight: 1.5, color: "#6B5A7D" }}>Everything important is tucked in. Resting and playing count too. 🧸</div>
        )}
        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
          <button type="button" onClick={() => selectDayType?.("soft")} style={{ ...softButton, minHeight: 40, padding: "7px 9px", fontSize: 11 }}>🌼 Soft</button>
          <button type="button" onClick={() => selectDayType?.("tiny")} style={{ ...softButton, minHeight: 40, padding: "7px 9px", fontSize: 11 }}>🌱 Tiny</button>
          <button type="button" onClick={openCare} style={{ ...softButton, minHeight: 40, padding: "7px 9px", fontSize: 11 }}>♥ Comfort</button>
        </div>
      </section>

      <BabyHabitAnchor open={open} rows={rows} viewDone={viewDone} period={period} toggle={toggle} />

      {babyScheduleEntries.length > 0 && <section aria-label="Today schedule" style={{ padding: 11, borderRadius: 15, background: "rgba(255,255,255,.78)", border: "1px solid #D9E5F1" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 10.5, letterSpacing: ".12em", fontWeight: 900, color: "#4A80B5" }}>🗓 TODAY’S SCHEDULE</div>
            <div style={{ marginTop: 2, fontSize: 10.5, color: "#8C6B9E", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{selectedSchedule?.label || scheduleDayId || "Today"}</div>
          </div>
          <button type="button" onClick={() => goToDashboard?.("week")} style={{ ...softButton, minHeight: 40, padding: "7px 10px", fontSize: 11.5, flexShrink: 0 }}>Open planner</button>
        </div>
        <div style={{ display: "grid", gap: 5, marginTop: 8 }}>
          {babyScheduleEntries.slice(0, 3).map((entry, index) => <div key={(entry.time || "any") + "-" + index} style={{ display: "grid", gridTemplateColumns: entry.time ? "62px 1fr" : "1fr", gap: 7, alignItems: "center", minHeight: 34, padding: "6px 8px", borderRadius: 9, background: entry.isException ? "#EEF9F5" : "#FFFFFFA8", border: "1px solid #E8E0EC" }}>
            {entry.time && <span style={{ fontSize: 11.5, color: "#4A80B5", fontWeight: 900 }}>{formatTime12 ? formatTime12(entry.time) : entry.time}</span>}
            <span style={{ minWidth: 0, fontSize: 11.8, color: "#5B4B6B", fontWeight: 800, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{entry.text || entry.label || entry.title || "Scheduled item"}</span>
          </div>)}
        </div>
        {babyScheduleEntries.length > 3 && <button type="button" onClick={() => goToDashboard?.("week")} style={{ marginTop: 6, minHeight: 40, padding: "7px 0", border: 0, background: "transparent", color: "#4A80B5", fontSize: 11.5, fontWeight: 900, cursor: "pointer" }}>+ {babyScheduleEntries.length - 3} more in PlushCalendar</button>}
      </section>}
      {resting && <section style={{ padding: "11px 13px", borderRadius: 15, background: "#EEF9F6", border: "1px solid #BFE5D2", color: "#3E746A" }}>
        <div style={{ fontWeight: 900, fontSize: 12.5 }}>🌴 Today is a rest day.</div>
        <div style={{ marginTop: 3, fontSize: 11.5, lineHeight: 1.45 }}>Nothing is required and your progress is safe.</div>
        <button type="button" onClick={toggleRestToday} style={{ ...softButton, marginTop: 7, padding: "7px 9px", fontSize: 11 }}>End rest day</button>
      </section>}

      <section style={{ padding: 12, borderRadius: 16, background: "rgba(255,255,255,.82)", border: "1px solid #E6D4F2" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
          <div>
            <div style={{ fontSize: 11, letterSpacing: ".13em", fontWeight: 900, color: "#A65DC1" }}>🧸 LITTLE JOBS</div>
            <div style={{ marginTop: 2, fontSize: 10.8, color: "#8C6B9E" }}>{waiting.length} still waiting</div>
          </div>
          <div style={{ fontSize: 11, fontWeight: 900, color: "#8C6B9E" }}>{Math.round(Number(pct) || 0)}%</div>
        </div>
        <div style={{ display: "grid", gap: 7, marginTop: 10 }}>
          {visible.map((task) => {
            const doneNow = !!viewDone[task.key];
            return <button key={task.key} type="button" onClick={() => toggle(task.key)} aria-label={doneNow ? `Mark ${task.label} incomplete` : `Mark ${task.label} complete`} style={littleJobStyle(doneNow)}>
              <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: "50%", border: doneNow ? 0 : "2px solid #B67AC8", background: doneNow ? "#B67AC8" : "transparent", color: "white", display: "grid", placeItems: "center", fontWeight: 900 }}>{doneNow ? "✓" : "○"}</span>
              <span style={{ fontSize: 13, lineHeight: 1.35, fontWeight: 850, textDecoration: doneNow ? "line-through" : "none" }}>{task.label}</span>
            </button>;
          })}
          {!visible.length && <div style={{ padding: "12px 2px", color: "#806B8D", fontSize: 12.5 }}>All tucked in. 💜</div>}
        </div>

        {completedCount > 0 && <details style={{ marginTop: 8, borderRadius: 12, border: "1px solid #E7DDEB", background: "rgba(255,255,255,.58)", overflow: "hidden" }}>
          <summary style={{ minHeight: 44, padding: "10px 11px", cursor: "pointer", color: "#806B8D", fontSize: 11.5, fontWeight: 900 }}>✓ {completedCount} tucked in today</summary>
          <div style={{ padding: "0 6px 6px" }}><CompletedTaskArea rows={allLittleJobs} viewDone={viewDone} lingerKeys={completedLingerKeys} toggle={toggle} title="Completed today" compact /></div>
        </details>}

        <div style={{ display: "flex", gap: 7, marginTop: 10, flexWrap: "wrap" }}>
          {waiting.length > 3 && <button type="button" aria-expanded={showAllLittleJobs} onClick={() => setShowAllLittleJobs((expanded) => !expanded)} style={{ ...softButton, minHeight: 40, padding: "7px 10px", fontSize: 11.5 }}>{showAllLittleJobs ? "Show fewer" : `Show all ${waiting.length}`}</button>}
          <button type="button" onClick={() => openTaskManager?.()} style={{ ...softButton, minHeight: 40, padding: "7px 10px", fontSize: 11.5 }}>✏️ Edit jobs</button>
        </div>
      </section>

      <details style={{ borderRadius: 17, background: "rgba(255,255,255,.72)", border: "1px solid #E6D4F2", overflow: "hidden" }}>
        <summary style={{ listStyle: "none", minHeight: 44, padding: "13px 14px", color: "#76558A", fontWeight: 900, cursor: "pointer" }}>🧸 Need a little help?</summary>
        <div style={{ padding: "0 10px 10px" }}>
          <BabyModeCareSuite date={period?.date || ""} todayDone={rows.filter((row) => !!viewDone[row.key] && !row.isBonus).length} todayTotal={rows.filter((row) => !row.isBonus).length} activityDays={activityDaysTotal} careDays={careDaysTotal} caregiverName={babyCaregiverName} comfortItemName={comfortItem} littleJobs={waiting.filter((row) => !viewDone[row.key])} onCompleteTask={toggle} onManageTasks={openTaskManager} onOpenJournal={openJournalForSelectedDate} />
        </div>
      </details>

      <section style={{ borderRadius: 17, background: "rgba(255,255,255,.72)", border: "1px solid #E6D4F2", overflow: "hidden" }}>
        <button type="button" onClick={() => setShowMore((value) => !value)} aria-expanded={showMore} style={{ width: "100%", minHeight: 48, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "13px 14px", border: 0, background: "transparent", color: "#76558A", fontWeight: 900, cursor: "pointer" }}>
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
