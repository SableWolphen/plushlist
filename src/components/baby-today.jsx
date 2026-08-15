import { BabyModeCareSuite } from "./baby-mode.jsx";
import { BabyHabitAnchor } from "./habit-intelligence.jsx";
import { CompletedTaskArea } from "./completed-task-flow.jsx";

const softButton = {
  minHeight: 38,
  padding: "7px 10px",
  borderRadius: 10,
  border: "1px solid #E2CDEB",
  background: "rgba(255,255,255,.9)",
  color: "#76558A",
  fontWeight: 900,
  fontSize: 11,
  cursor: "pointer",
};

function caregiverScheduleText(label) {
  const text = String(label || "").trim();
  const lower = text.toLowerCase();
  if (!text) return "One little thing to remember";
  if (/wake|wake-up|wake up/.test(lower)) return `Wake up nice and easy${/husband/.test(lower) ? " with your husband" : ""}`;
  if (/breakfast/.test(lower)) return "Cozy breakfast";
  if (/lunch/.test(lower)) return "Lunch time";
  if (/dinner|supper/.test(lower)) return "Cozy dinner";
  if (/work/.test(lower)) return "Work time — one little step at a time";
  if (/appointment|doctor|dentist|therapy|therapist|counselor/.test(lower)) return "Caring appointment — one step at a time";
  if (/office|leave|head out|drive|go to|needs to be at/.test(lower)) return text.replace(/[.!?]+$/, "");
  if (/bed|sleep|wind down/.test(lower)) return "Cozy wind-down time";
  return text.replace(/[.!?]+$/, "");
}

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
  moveTaskGroup,
  startPointerTaskDrag,
  movePointerTaskDrag,
  endPointerTaskDrag,
  cancelPointerTaskDrag,
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
  if (!open) return null;

  const allLittleJobs = rows.filter((row) => !row.isBonus);
  const lingering = new Set(recentlyCompletedKeys || []);
  const waiting = allLittleJobs.filter((row) => !viewDone[row.key] || lingering.has(row.key));
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

  const caregiver = babyCaregiverName || "Mommy";

  return (
    <div className="baby-today-simple" style={{ display: "grid", gap: 7, marginBottom: 8 }}>
      {resting && <section style={{ padding: "8px 10px", borderRadius: 12, background: "#EEF9F6", border: "1px solid #BFE5D2", color: "#3E746A", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div><strong style={{ fontSize: 11.5 }}>🌴 Soft rest day</strong><div style={{ marginTop: 1, fontSize: 10 }}>Nothing is required today.</div></div>
        <button type="button" onClick={toggleRestToday} style={{ ...softButton, minHeight: 32, padding: "5px 8px", fontSize: 10 }}>End rest</button>
      </section>}

      <section aria-label="Little jobs" style={{ borderRadius: 14, background: "rgba(255,255,255,.76)", border: "1px solid #E6D4F2", overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "9px 11px 7px" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 12.5, color: "#76558A", fontWeight: 900 }}>🧸 {waiting.length ? `${waiting.length} little job${waiting.length === 1 ? "" : "s"}` : "All tucked in"}</div>
            <div style={{ marginTop: 1, fontSize: 9.8, color: "#9A85A5", fontWeight: 700 }}>Everything for today, all in one place.</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
            {completedCount > 0 && <details style={{ position: "relative" }}>
              <summary style={{ listStyle: "none", cursor: "pointer", color: "#806B8D", fontSize: 10, fontWeight: 900, padding: "4px 7px", borderRadius: 999, background: "#F7F0F9", border: "1px solid #E7DDEB" }}>✓ {completedCount}</summary>
              <div style={{ position: "absolute", right: 0, zIndex: 20, width: "min(320px,78vw)", marginTop: 5, padding: 6, borderRadius: 12, background: "#FFF", border: "1px solid #E7DDEB", boxShadow: "0 12px 30px rgba(80,55,95,.18)" }}><CompletedTaskArea rows={allLittleJobs} viewDone={viewDone} lingerKeys={completedLingerKeys} toggle={toggle} title="Completed today" compact /></div>
            </details>}
            <button type="button" onClick={() => openTaskManager?.()} aria-label="Edit little jobs" title="Edit little jobs" style={{ width: 30, height: 30, padding: 0, borderRadius: 9, border: "1px solid #E2CDEB", background: "#FFF", color: "#806B8D", cursor: "pointer", fontSize: 14 }}>⚙️</button>
          </div>
        </div>

        {waiting.length > 0 ? <div style={{ borderTop: "1px solid #F0E7F2" }}>
          {waiting.map((task, index) => {
            const doneNow = !!viewDone[task.key];
            const section = task.isEveryday ? "Daily" : (task.section || "");
            const previousTask = waiting[index - 1];
            const previousSection = previousTask ? (previousTask.isEveryday ? "Daily" : (previousTask.section || "")) : null;
            const showSection = !!section && section !== previousSection;
            return <React.Fragment key={task.key}>
              {showSection && <div style={{ padding: index === 0 ? "6px 11px 3px" : "7px 11px 3px", background: "#FCF8FD", color: "#A06AB0", fontSize: 8.8, lineHeight: 1.1, letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 900 }}>{section}</div>}
              <button type="button" onClick={() => toggle(task.key)} aria-label={doneNow ? `Mark ${task.label} incomplete` : `Mark ${task.label} complete`} style={{ width: "100%", minHeight: 38, display: "grid", gridTemplateColumns: "22px minmax(0,1fr)", gap: 8, alignItems: "center", padding: "6px 11px", border: 0, borderTop: "1px solid #F4EDF5", background: doneNow ? "#FAF6FC" : "rgba(255,255,255,.72)", color: doneNow ? "#A081AD" : "#5B4B6B", textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}>
                <span aria-hidden="true" style={{ boxSizing: "border-box", width: 20, height: 20, borderRadius: "50%", border: doneNow ? "2px solid #A65DC1" : "2px solid #B878CB", background: doneNow ? "#A65DC1" : "white", color: "white", display: "grid", placeItems: "center", fontSize: 11, fontWeight: 900 }}>{doneNow ? "✓" : ""}</span>
                <span style={{ minWidth: 0, fontSize: 11.6, lineHeight: 1.25, fontWeight: 800, textDecoration: doneNow ? "line-through" : "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{task.label}</span>
              </button>
            </React.Fragment>;
          })}
        </div> : <div style={{ padding: "8px 11px 10px", color: "#806B8D", fontSize: 11 }}>Everything is tucked in. 💜</div>}
      </section>

      <button type="button" onClick={openCare} style={{ ...softButton, minHeight: 38, width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: 6, background: "rgba(255,255,255,.88)" }}>
        🧸 I need a little help
      </button>

      {babyScheduleEntries.length > 0 && <section aria-label={`${caregiver}'s gentle schedule`} style={{ padding: 12, borderRadius: 16, background: "rgba(255,255,255,0.58)", border: "1px solid #D9E5F1" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 11, letterSpacing: ".16em", color: "#4A80B5", fontWeight: 900 }}>🗓️ {caregiver.toUpperCase()}’S LITTLE PLAN</div>
            <div style={{ marginTop: 2, fontSize: 10.5, color: "#806B8D" }}>One little part at a time 💛</div>
          </div>
          {comfortItem && <span title={`${comfortItem} can stay close`} style={{ maxWidth: "48%", padding: "4px 7px", borderRadius: 999, background: "#FFF7E8", color: "#806A45", fontSize: 9.5, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>🧸 {comfortItem} close</span>}
        </div>
        <div style={{ display: "grid", gap: 5, marginTop: 8 }}>
          {babyScheduleEntries.map((entry, index) => {
            const rawLabel = entry.text || entry.label || entry.title || "Scheduled item";
            return <div key={(entry.time || "any") + "-" + index} style={{ display: "grid", gridTemplateColumns: entry.time ? "70px minmax(0,1fr)" : "1fr", alignItems: "center", gap: 7, padding: "8px 9px", borderRadius: 9, background: entry.isException ? "#EEF9F5" : "#FFFFFF99", border: entry.isException ? "1px solid #B9E0D0" : "1px solid #EFE3F3" }}>
              {entry.time && <span style={{ fontSize: 13, color: "#4A80B5", fontWeight: 900 }}>{formatTime12 ? formatTime12(entry.time) : entry.time}</span>}
              <span style={{ minWidth: 0, fontSize: 12.5, lineHeight: 1.35, color: "#5B4B6B", fontWeight: 600 }}>{entry.isException && <span style={{ marginRight: 5, color: "#318C79", fontSize: 10, fontWeight: 900 }}>EXTRA</span>}{caregiverScheduleText(rawLabel)}</span>
            </div>;
          })}
        </div>
      </section>}

      <section style={{ borderRadius: 12, background: "rgba(255,255,255,.56)", border: "1px solid #E6D4F2", overflow: "hidden" }}>
        <button type="button" onClick={() => setShowMore((value) => !value)} aria-expanded={showMore} style={{ width: "100%", minHeight: 36, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "7px 10px", border: 0, background: "transparent", color: "#76558A", fontWeight: 900, fontSize: 10.5, cursor: "pointer" }}>
          <span>🌈 More when I’m ready</span><span aria-hidden="true">{showMore ? "▾" : "›"}</span>
        </button>
        {showMore && <div style={{ padding: "0 8px 8px", display: "grid", gap: 6 }}>
          <BabyHabitAnchor open={open} rows={rows} viewDone={viewDone} period={period} toggle={toggle} />
          <details style={{ borderRadius: 11, background: "rgba(255,255,255,.72)", border: "1px solid #E6D4F2", overflow: "hidden" }}>
            <summary style={{ listStyle: "none", minHeight: 36, padding: "8px 9px", color: "#76558A", fontWeight: 900, fontSize: 10.5, cursor: "pointer" }}>🧸 Cozy care corner</summary>
            <div style={{ padding: "0 7px 7px" }}>
              <BabyModeCareSuite date={period?.date || ""} todayDone={rows.filter((row) => !!viewDone[row.key] && !row.isBonus).length} todayTotal={rows.filter((row) => !row.isBonus).length} activityDays={activityDaysTotal} careDays={careDaysTotal} caregiverName={babyCaregiverName} comfortItemName={comfortItem} littleJobs={waiting.filter((row) => !viewDone[row.key])} onCompleteTask={toggle} onManageTasks={openTaskManager} onOpenJournal={openJournalForSelectedDate} />
            </div>
          </details>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 5 }}>
            <button type="button" onClick={() => selectDayType?.("soft")} style={softButton}>🌼 Soft</button>
            <button type="button" onClick={() => selectDayType?.("tiny")} style={softButton}>🌱 Tiny</button>
            <button type="button" onClick={() => goToDashboard?.("week")} style={softButton}>🗓 Plan</button>
            <button type="button" onClick={() => openJournalForSelectedDate?.()} style={softButton}>📖 Journal</button>
            <button type="button" onClick={() => goToDashboard?.("progress")} style={softButton}>📈 Progress</button>
            <button type="button" onClick={() => openTaskManager?.()} style={softButton}>⚙️ Tasks</button>
          </div>
        </div>}
      </section>
    </div>
  );
}
