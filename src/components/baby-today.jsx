import { BabyModeCareSuite } from "./baby-mode.jsx";
import { BabyHabitAnchor } from "./habit-intelligence.jsx";
import { CompletedTaskArea } from "./completed-task-flow.jsx";

const softButton = {
  minHeight: 40,
  padding: "8px 10px",
  borderRadius: 11,
  border: "1px solid #E2CDEB",
  background: "rgba(255,255,255,.9)",
  color: "#76558A",
  fontWeight: 900,
  fontSize: 11.5,
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
    <div className="baby-today-simple" style={{ display: "grid", gap: 8, marginBottom: 10 }}>
      {resting && <section style={{ padding: "9px 11px", borderRadius: 13, background: "#EEF9F6", border: "1px solid #BFE5D2", color: "#3E746A", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
        <div><strong style={{ fontSize: 12 }}>🌴 Soft rest day</strong><div style={{ marginTop: 1, fontSize: 10.5 }}>Nothing is required today.</div></div>
        <button type="button" onClick={toggleRestToday} style={{ ...softButton, minHeight: 34, padding: "6px 8px", fontSize: 10.5 }}>End rest</button>
      </section>}

      <section aria-label="Little jobs" style={{ borderRadius: 15, background: "rgba(255,255,255,.72)", border: "1px solid #E6D4F2", padding: "10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 12.5, color: "#76558A", fontWeight: 900 }}>🧸 {waiting.length ? `${waiting.length} little job${waiting.length === 1 ? "" : "s"}` : "All tucked in"}</div>
            <div style={{ marginTop: 1, fontSize: 10.2, color: "#9A85A5", fontWeight: 700 }}>Everything is here — no extra page.</div>
          </div>
          {completedCount > 0 && <details style={{ position: "relative" }}>
            <summary style={{ listStyle: "none", cursor: "pointer", color: "#806B8D", fontSize: 10.5, fontWeight: 900, padding: "5px 7px", borderRadius: 999, background: "#F7F0F9", border: "1px solid #E7DDEB" }}>✓ {completedCount}</summary>
            <div style={{ position: "absolute", right: 0, zIndex: 20, width: "min(320px,78vw)", marginTop: 5, padding: 6, borderRadius: 12, background: "#FFF", border: "1px solid #E7DDEB", boxShadow: "0 12px 30px rgba(80,55,95,.18)" }}><CompletedTaskArea rows={allLittleJobs} viewDone={viewDone} lingerKeys={completedLingerKeys} toggle={toggle} title="Completed today" compact /></div>
          </details>}
        </div>

        {waiting.length > 0 ? <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 6 }}>
          {waiting.map((task) => {
            const doneNow = !!viewDone[task.key];
            const section = task.isEveryday ? "Daily" : (task.section || "");
            return <button key={task.key} type="button" onClick={() => toggle(task.key)} aria-label={doneNow ? `Mark ${task.label} incomplete` : `Mark ${task.label} complete`} style={{ minWidth: 0, minHeight: 48, display: "grid", gridTemplateColumns: "22px minmax(0,1fr)", gap: 7, alignItems: "center", padding: "7px 8px", borderRadius: 11, border: "1px solid #E2D5E8", background: doneNow ? "#FAF6FC" : "white", color: doneNow ? "#A081AD" : "#5B4B6B", textAlign: "left", cursor: "pointer", fontFamily: "inherit" }}>
              <span aria-hidden="true" style={{ boxSizing: "border-box", width: 21, height: 21, borderRadius: "50%", border: doneNow ? "2px solid #A65DC1" : "2px solid #B878CB", background: doneNow ? "#A65DC1" : "white", color: "white", display: "grid", placeItems: "center", fontSize: 12, fontWeight: 900 }}>{doneNow ? "✓" : ""}</span>
              <span style={{ minWidth: 0 }}>
                {section && <span style={{ display: "block", marginBottom: 1, fontSize: 8.5, lineHeight: 1.1, letterSpacing: ".06em", textTransform: "uppercase", color: "#A06AB0", fontWeight: 900 }}>{section}</span>}
                <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", fontSize: 11.2, lineHeight: 1.25, fontWeight: 800, textDecoration: doneNow ? "line-through" : "none" }}>{task.label}</span>
              </span>
            </button>;
          })}
        </div> : <div style={{ padding: "8px 2px 2px", color: "#806B8D", fontSize: 11.5 }}>Everything is tucked in. 💜</div>}
      </section>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 7 }}>
        <button type="button" onClick={openCare} style={{ ...softButton, minHeight: 40, display: "flex", justifyContent: "center", alignItems: "center", gap: 6, background: "rgba(255,255,255,.9)", fontSize: 11.5 }}>
          🧸 I need a little help
        </button>
        <button type="button" onClick={() => openTaskManager?.()} aria-label="Edit little jobs" style={{ ...softButton, minWidth: 42, minHeight: 40, padding: "7px 9px" }}>⚙️</button>
      </div>

      {babyScheduleEntries.length > 0 && <section aria-label={`${caregiver}'s gentle schedule`} style={{ padding: "10px", borderRadius: 15, background: "linear-gradient(145deg,#F9FCFF,#FFF9FD)", border: "1px solid #D9E5F1" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 7 }}>
          <div>
            <div style={{ fontSize: 10.5, letterSpacing: ".1em", fontWeight: 900, color: "#4A80B5" }}>{caregiver.toUpperCase()}’S LITTLE PLAN</div>
            <div style={{ marginTop: 1, fontSize: 10.3, color: "#806B8D" }}>One little part at a time 💛</div>
          </div>
          {comfortItem && <span style={{ maxWidth: "48%", padding: "4px 7px", borderRadius: 999, background: "#FFF7E8", color: "#806A45", fontSize: 9.5, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>🧸 {comfortItem} can stay close</span>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 6 }}>
          {babyScheduleEntries.map((entry, index) => {
            const rawLabel = entry.text || entry.label || entry.title || "Scheduled item";
            return <div key={(entry.time || "any") + "-" + index} style={{ minWidth: 0, display: "grid", gridTemplateColumns: entry.time ? "58px minmax(0,1fr)" : "1fr", gap: 6, alignItems: "center", padding: "7px 8px", borderRadius: 10, background: entry.isException ? "#EEF9F5" : "#FFFFFFB8", border: "1px solid #E8E0EC" }}>
              {entry.time && <span style={{ fontSize: 10.5, color: "#4A80B5", fontWeight: 900 }}>{formatTime12 ? formatTime12(entry.time) : entry.time}</span>}
              <span style={{ minWidth: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", fontSize: 10.6, color: "#5B4B6B", fontWeight: 750, lineHeight: 1.25 }}>{caregiverScheduleText(rawLabel)}</span>
            </div>;
          })}
        </div>
      </section>}

      <section style={{ borderRadius: 13, background: "rgba(255,255,255,.58)", border: "1px solid #E6D4F2", overflow: "hidden" }}>
        <button type="button" onClick={() => setShowMore((value) => !value)} aria-expanded={showMore} style={{ width: "100%", minHeight: 38, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "8px 10px", border: 0, background: "transparent", color: "#76558A", fontWeight: 900, fontSize: 10.8, cursor: "pointer" }}>
          <span>🌈 More when I’m ready</span><span aria-hidden="true">{showMore ? "▾" : "›"}</span>
        </button>
        {showMore && <div style={{ padding: "0 9px 9px", display: "grid", gap: 7 }}>
          <BabyHabitAnchor open={open} rows={rows} viewDone={viewDone} period={period} toggle={toggle} />
          <details style={{ borderRadius: 12, background: "rgba(255,255,255,.72)", border: "1px solid #E6D4F2", overflow: "hidden" }}>
            <summary style={{ listStyle: "none", minHeight: 38, padding: "9px 10px", color: "#76558A", fontWeight: 900, fontSize: 10.8, cursor: "pointer" }}>🧸 Cozy care corner</summary>
            <div style={{ padding: "0 8px 8px" }}>
              <BabyModeCareSuite date={period?.date || ""} todayDone={rows.filter((row) => !!viewDone[row.key] && !row.isBonus).length} todayTotal={rows.filter((row) => !row.isBonus).length} activityDays={activityDaysTotal} careDays={careDaysTotal} caregiverName={babyCaregiverName} comfortItemName={comfortItem} littleJobs={waiting.filter((row) => !viewDone[row.key])} onCompleteTask={toggle} onManageTasks={openTaskManager} onOpenJournal={openJournalForSelectedDate} />
            </div>
          </details>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 6 }}>
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
