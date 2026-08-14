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

function caregiverScheduleText(label) {
  const text = String(label || "").trim();
  const lower = text.toLowerCase();
  if (!text) return "We have one little thing to remember.";
  if (/wake|wake-up|wake up/.test(lower)) return `Time to wake up nice and easy${/husband/.test(lower) ? " with your husband" : ""}.`;
  if (/breakfast/.test(lower)) return "Time for a little breakfast so your tummy has something in it.";
  if (/lunch/.test(lower)) return "Time to get some lunch in your tummy, baby.";
  if (/dinner|supper/.test(lower)) return "Dinner time, baby. We can take it nice and slow.";
  if (/work/.test(lower)) return "Work time, baby — just one little step at a time.";
  if (/appointment|doctor|dentist|therapy|therapist|counselor/.test(lower)) return "We have an appointment. We’ll get ready one little step at a time.";
  if (/office|leave|head out|drive|go to|needs to be at/.test(lower)) return `We need to remember: ${text.replace(/[.!?]+$/, "")}.`;
  if (/bed|sleep|wind down/.test(lower)) return "It’s getting close to cozy time. We can start slowing everything down.";
  return `Baby, this is when we do: ${text.replace(/[.!?]+$/, "")}.`;
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
  const [showLittleJobs, setShowLittleJobs] = React.useState(false);
  const [showAllLittleJobs, setShowAllLittleJobs] = React.useState(false);
  const [showFullSchedule, setShowFullSchedule] = React.useState(false);
  if (!open) return null;

  const allLittleJobs = rows.filter((row) => !row.isBonus);
  const lingering = new Set(recentlyCompletedKeys || []);
  const waiting = allLittleJobs.filter((row) => !viewDone[row.key] || lingering.has(row.key));
  const visible = showAllLittleJobs ? waiting : waiting.slice(0, 3);
  const visibleGroupOrder = Array.from(new Set(waiting.map((row) => row.section).filter(Boolean)));
  const visibleGroups = [];
  for (const task of visible) {
    const groupKey = task.isEveryday ? "__daily__" : (task.section || "__other__");
    let group = visibleGroups.find((item) => item.key === groupKey);
    if (!group) {
      group = {
        key: groupKey,
        section: task.section || "",
        label: task.isEveryday ? "Daily" : (task.section || "Little Jobs"),
        tasks: [],
      };
      visibleGroups.push(group);
    }
    group.tasks.push(task);
  }
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
    gridTemplateColumns: "24px minmax(0,1fr) 36px",
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

  const caregiver = babyCaregiverName || "Mommy";
  const schedulePreviewCount = 2;

  return (
    <div className="baby-today-simple" style={{ display: "grid", gap: 10, marginBottom: 14 }}>
      <section style={{ padding: 15, borderRadius: 19, background: "linear-gradient(145deg,#FFF8FD,#F4FBFF)", border: "1px solid #E3C9EC", boxShadow: "0 6px 18px rgba(118,85,138,.06)" }}>
        <div style={{ fontSize: 11, letterSpacing: ".14em", fontWeight: 900, color: "#A65DC1" }}>🍼 YOUR TINY THING</div>
        {nextStepTask ? (
          <>
            <div style={{ marginTop: 6, fontSize: 19, lineHeight: 1.28, fontWeight: 900, color: "#4F405C" }}>
              {nextStepTask.sourceTask && <HabitTypeIcon task={nextStepTask.sourceTask} />}{nextStepTask.label}
            </div>
            {nextStepHint?.key === nextStepTask.key && <div style={{ marginTop: 7, fontSize: 12, lineHeight: 1.45, color: "#806B8D" }}>🌱 {nextStepHint.text}</div>}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 11 }}>
              <button type="button" onClick={() => toggle(nextStepTask.key)} style={{ ...softButton, border: 0, background: "#A65DC1", color: "white" }}>✓ Tuck it in</button>
              <button type="button" onClick={() => pickEasierSuggestion?.(nextStepTask.key)} style={softButton}>🌱 Make it tinier</button>
            </div>
          </>
        ) : (
          <div style={{ marginTop: 7, fontSize: 14, lineHeight: 1.5, color: "#6B5A7D" }}>Everything important is tucked in. Resting and playing count too. 🧸</div>
        )}
      </section>

      {babyScheduleEntries.length > 0 && <section aria-label={`${caregiver}'s gentle schedule`} style={{ padding: 14, borderRadius: 18, background: "linear-gradient(145deg,#F9FCFF,#FFF9FD)", border: "1px solid #D9E5F1" }}>
        <div style={{ fontSize: 11, letterSpacing: ".12em", fontWeight: 900, color: "#4A80B5" }}>🗓 {caregiver.toUpperCase()}’S LITTLE PLAN</div>
        <div style={{ marginTop: 5, fontSize: 13.2, lineHeight: 1.5, color: "#665474", fontWeight: 750 }}>
          Hey baby, here’s what we’re doing today. You only have to look at one little part at a time.
        </div>
        {comfortItem && <div style={{ marginTop: 6, padding: "7px 9px", borderRadius: 10, background: "#FFF7E8", color: "#806A45", fontSize: 11.8, lineHeight: 1.45 }}>
          🧸 {caregiver} says you can keep <strong>{comfortItem}</strong> close or bring it with you if that helps.
        </div>}
        <div style={{ display: "grid", gap: 7, marginTop: 10 }}>
          {babyScheduleEntries.slice(0, showFullSchedule ? babyScheduleEntries.length : schedulePreviewCount).map((entry, index) => {
            const rawLabel = entry.text || entry.label || entry.title || "Scheduled item";
            return <div key={(entry.time || "any") + "-" + index} style={{ display: "grid", gridTemplateColumns: entry.time ? "72px minmax(0,1fr)" : "1fr", gap: 9, alignItems: "start", padding: "9px 10px", borderRadius: 12, background: entry.isException ? "#EEF9F5" : "#FFFFFFB8", border: "1px solid #E8E0EC" }}>
              {entry.time && <span style={{ fontSize: 12, color: "#4A80B5", fontWeight: 900, paddingTop: 1 }}>{formatTime12 ? formatTime12(entry.time) : entry.time}</span>}
              <span style={{ minWidth: 0, fontSize: 12.3, color: "#5B4B6B", fontWeight: 750, lineHeight: 1.45 }}>{caregiverScheduleText(rawLabel)}</span>
            </div>;
          })}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
          {babyScheduleEntries.length > schedulePreviewCount && <button type="button" aria-expanded={showFullSchedule} onClick={() => setShowFullSchedule((shown) => !shown)} style={{ ...softButton, minHeight: 42, padding: "8px 10px", fontSize: 11.5 }}>
            {showFullSchedule ? "That’s enough for now" : `🧸 Show ${babyScheduleEntries.length - schedulePreviewCount} more`}
          </button>}
          {showFullSchedule && <button type="button" onClick={() => goToDashboard?.("week")} style={{ ...softButton, minHeight: 42, padding: "8px 10px", fontSize: 11.5 }}>🗓 Grown-up planner</button>}
        </div>
      </section>}

      {resting && <section style={{ padding: "12px 14px", borderRadius: 16, background: "#EEF9F6", border: "1px solid #BFE5D2", color: "#3E746A" }}>
        <div style={{ fontWeight: 900, fontSize: 13 }}>🌴 It’s a soft rest day, baby.</div>
        <div style={{ marginTop: 3, fontSize: 11.8, lineHeight: 1.45 }}>Nothing is required. Your progress is safe and you can just be little today.</div>
        <button type="button" onClick={toggleRestToday} style={{ ...softButton, marginTop: 7, padding: "7px 9px", fontSize: 11 }}>End rest day</button>
      </section>}

      <button type="button" onClick={openCare} style={{ ...softButton, width: "100%", minHeight: 54, display: "flex", justifyContent: "center", alignItems: "center", gap: 8, fontSize: 14, background: "rgba(255,255,255,.9)" }}>
        🧸 I need a little help
      </button>

      <section style={{ borderRadius: 17, background: "rgba(255,255,255,.72)", border: "1px solid #E6D4F2", overflow: "hidden" }}>
        <button type="button" onClick={() => setShowLittleJobs((value) => !value)} aria-expanded={showLittleJobs} style={{ width: "100%", minHeight: 50, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "13px 14px", border: 0, background: "transparent", color: "#76558A", fontWeight: 900, cursor: "pointer", textAlign: "left" }}>
          <span><span style={{ display: "block", fontSize: 13 }}>🧸 {waiting.length ? `${waiting.length} little job${waiting.length === 1 ? "" : "s"} are waiting` : "All my little jobs are tucked in"}</span><span style={{ display: "block", marginTop: 2, fontSize: 10.8, fontWeight: 700, color: "#9A85A5" }}>{showLittleJobs ? "You can tuck them in here." : "Only open this when you want to see them."}</span></span>
          <span aria-hidden="true">{showLittleJobs ? "▾" : "›"}</span>
        </button>

        {showLittleJobs && <div style={{ padding: "0 12px 12px" }}>
          <div style={{ display: "grid", gap: 7 }}>
            {visibleGroups.map((group) => {
              const groupIndex = visibleGroupOrder.indexOf(group.section);
              return <div key={group.key} style={{ display: "grid", gap: 7 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "2px 2px 0" }}>
                  <span style={{ fontSize: 10.5, letterSpacing: ".12em", color: "#A65DC1", fontWeight: 900 }}>{group.label.toUpperCase()}</span>
                  {showAllLittleJobs && group.section && visibleGroupOrder.length > 1 && <span style={{ display: "flex", gap: 4 }}>
                    <button type="button" disabled={groupIndex <= 0} onClick={() => moveTaskGroup?.(group.section, -1, visibleGroupOrder)} aria-label={`Move ${group.label} group earlier`} title="Move group earlier" style={{ width: 36, minWidth: 36, height: 36, padding: 0, borderRadius: 9, border: "1px solid #E7D2E8", background: "white", color: "#A65DC1", opacity: groupIndex <= 0 ? .35 : 1, fontWeight: 900, cursor: groupIndex <= 0 ? "default" : "pointer" }}>↑</button>
                    <button type="button" disabled={groupIndex < 0 || groupIndex === visibleGroupOrder.length - 1} onClick={() => moveTaskGroup?.(group.section, 1, visibleGroupOrder)} aria-label={`Move ${group.label} group later`} title="Move group later" style={{ width: 36, minWidth: 36, height: 36, padding: 0, borderRadius: 9, border: "1px solid #E7D2E8", background: "white", color: "#A65DC1", opacity: groupIndex < 0 || groupIndex === visibleGroupOrder.length - 1 ? .35 : 1, fontWeight: 900, cursor: groupIndex < 0 || groupIndex === visibleGroupOrder.length - 1 ? "default" : "pointer" }}>↓</button>
                  </span>}
                </div>
                {group.tasks.map((task) => {
                  const doneNow = !!viewDone[task.key];
                  return <div key={task.key} style={littleJobStyle(doneNow)}>
                    <button type="button" onClick={() => toggle(task.key)} aria-label={doneNow ? `Mark ${task.label} incomplete` : `Mark ${task.label} complete`} style={{ width: 24, height: 24, padding: 0, border: 0, background: "transparent", cursor: "pointer" }}>
                      <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: "50%", border: doneNow ? 0 : "2px solid #B67AC8", background: doneNow ? "#B67AC8" : "transparent", color: "white", display: "grid", placeItems: "center", fontWeight: 900 }}>{doneNow ? "✓" : "○"}</span>
                    </button>
                    <button type="button" onClick={() => toggle(task.key)} style={{ minWidth: 0, padding: 0, border: 0, background: "transparent", color: "inherit", textAlign: "left", cursor: "pointer" }}>
                      <span style={{ fontSize: 13, lineHeight: 1.35, fontWeight: 850, textDecoration: doneNow ? "line-through" : "none" }}>{task.label}</span>
                    </button>
                    {showAllLittleJobs && task.sourceTask?.task_key && <button type="button" draggable={false} aria-label={`Reorder ${task.label}`} title="Hold and drag to move" onClick={(event) => { event.preventDefault(); event.stopPropagation(); }} onPointerDown={(event) => startPointerTaskDrag?.(event, task.sourceTask.task_key, task.label)} onPointerMove={movePointerTaskDrag} onPointerUp={endPointerTaskDrag} onPointerCancel={cancelPointerTaskDrag} onContextMenu={(event) => event.preventDefault()} style={{ width: 36, minWidth: 36, height: 36, padding: 0, borderRadius: 9, border: "1px solid #E7D2E8", background: "#FFF9FD", color: "#A65DC1", fontWeight: 900, fontSize: 17, lineHeight: 1, cursor: "grab", touchAction: "none" }}>⋮⋮</button>}
                  </div>;
                })}
              </div>;
            })}
            {!visible.length && <div style={{ padding: "12px 2px", color: "#806B8D", fontSize: 12.5 }}>All tucked in. 💜</div>}
          </div>

          {completedCount > 0 && <details style={{ marginTop: 8, borderRadius: 12, border: "1px solid #E7DDEB", background: "rgba(255,255,255,.58)", overflow: "hidden" }}>
            <summary style={{ minHeight: 44, padding: "10px 11px", cursor: "pointer", color: "#806B8D", fontSize: 11.5, fontWeight: 900 }}>✓ {completedCount} tucked in today</summary>
            <div style={{ padding: "0 6px 6px" }}><CompletedTaskArea rows={allLittleJobs} viewDone={viewDone} lingerKeys={completedLingerKeys} toggle={toggle} title="Completed today" compact /></div>
          </details>}

          {waiting.length > 3 && <button type="button" aria-expanded={showAllLittleJobs} onClick={() => setShowAllLittleJobs((expanded) => !expanded)} style={{ ...softButton, marginTop: 9, minHeight: 42, padding: "8px 10px", fontSize: 11.5 }}>{showAllLittleJobs ? "That’s enough for now" : `Show all ${waiting.length}`}</button>}
        </div>}
      </section>

      <section style={{ borderRadius: 17, background: "rgba(255,255,255,.66)", border: "1px solid #E6D4F2", overflow: "hidden" }}>
        <button type="button" onClick={() => setShowMore((value) => !value)} aria-expanded={showMore} style={{ width: "100%", minHeight: 48, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, padding: "13px 14px", border: 0, background: "transparent", color: "#76558A", fontWeight: 900, cursor: "pointer" }}>
          <span>🌈 More when I’m ready</span><span aria-hidden="true">{showMore ? "▾" : "›"}</span>
        </button>
        {showMore && <div style={{ padding: "0 12px 12px", display: "grid", gap: 8 }}>
          <BabyHabitAnchor open={open} rows={rows} viewDone={viewDone} period={period} toggle={toggle} />
          <details style={{ borderRadius: 14, background: "rgba(255,255,255,.72)", border: "1px solid #E6D4F2", overflow: "hidden" }}>
            <summary style={{ listStyle: "none", minHeight: 44, padding: "12px", color: "#76558A", fontWeight: 900, cursor: "pointer" }}>🧸 Cozy care corner</summary>
            <div style={{ padding: "0 10px 10px" }}>
              <BabyModeCareSuite date={period?.date || ""} todayDone={rows.filter((row) => !!viewDone[row.key] && !row.isBonus).length} todayTotal={rows.filter((row) => !row.isBonus).length} activityDays={activityDaysTotal} careDays={careDaysTotal} caregiverName={babyCaregiverName} comfortItemName={comfortItem} littleJobs={waiting.filter((row) => !viewDone[row.key])} onCompleteTask={toggle} onManageTasks={openTaskManager} onOpenJournal={openJournalForSelectedDate} />
            </div>
          </details>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 7 }}>
            <button type="button" onClick={() => selectDayType?.("soft")} style={softButton}>🌼 Soft day</button>
            <button type="button" onClick={() => selectDayType?.("tiny")} style={softButton}>🌱 Tiny day</button>
            <button type="button" onClick={() => goToDashboard?.("week")} style={softButton}>🗓 Planner</button>
            <button type="button" onClick={() => openJournalForSelectedDate?.()} style={softButton}>📖 Journal</button>
            <button type="button" onClick={() => goToDashboard?.("progress")} style={softButton}>📈 Progress</button>
            <button type="button" onClick={() => openTaskManager?.()} style={softButton}>⚙️ Task setup</button>
          </div>
        </div>}
      </section>
    </div>
  );
}
