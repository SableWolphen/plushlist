import { HabitStudio, HabitGoalCaption } from "./habit-studio.jsx";
// The "Change my tasks" ToolPanel — module split phase 7, seventh
// slice, third of the "big four" (see docs/module-split-plan.md).
// Task creation (with natural-language schedule parsing, starter
// packs, and bulk import) plus the editable/draggable task list
// itself. The edit-task modal, delete-confirmation dialog, and
// ask-for-help modal are separate always-in-tree overlays elsewhere
// in GlowUpTracker (not inside this ToolPanel), so this only needed
// the setters/handlers that open them (setPendingTaskDelete,
// startEditingTask), not the modals themselves.
import { ToolPanel, HabitTypeIcon } from "./shared.jsx";
import { QuickCapture } from "./quick-capture.jsx";
import { ThemeScene } from "./theme-world.jsx";
import { useCompletedTaskFlow } from "./completed-task-flow.jsx";

export function TasksPanel({ open, onClose, inline = false, initialView = "today", viewRequest = 0, rows = [], viewDone = {}, toggle, newTaskDay, setNewTaskDay, taskSectionsForDay, setNewTaskSection, setNewTaskCustomSection, starterPackId, setStarterPackId, trackerTasks, setStarterPackMessage, addStarterPack, starterPackMessage, importOpen, setImportOpen, newTaskSection, importText, setImportText, importTasksFromText, importMessage, newTaskNameInputRef, newTaskName, setNewTaskName, taskMessage, setTaskMessage, naturalScheduleText, setNaturalScheduleText, naturalSchedulePreview, setNaturalSchedulePreview, applyNaturalSchedule, newTaskSectionOptions, newTaskCustomSection, taskAdvancedOpen, setTaskAdvancedOpen, newTaskWhy, setNewTaskWhy, newTaskSoftLabel, setNewTaskSoftLabel, newTaskTinyLabel, setNewTaskTinyLabel, newTaskEstimatedMinutes, setNewTaskEstimatedMinutes, newTaskEssentialOnLow, setNewTaskEssentialOnLow, newTaskKind, setNewTaskKind, newTaskScheduleType, setNewTaskScheduleType, newTaskScheduleDays, setNewTaskScheduleDays, newTaskReminderTime, setNewTaskReminderTime, newTaskStartDate, setNewTaskStartDate, newTaskEndDate, setNewTaskEndDate, newTaskOneTimeDate, setNewTaskOneTimeDate, selectedProgressDate, addTrackerTask, SUPPORTER_FEATURES_ENABLED, isSupporterAccount, FREE_TASK_LIMIT_PER_DAY, taskSearchQuery, setTaskSearchQuery, isTaskPausedOnDate, period, startPointerTaskDrag, movePointerTaskDrag, endPointerTaskDrag, cancelPointerTaskDrag, moveTaskToSection, startEditingTask, resumeTrackerTask, pauseTrackerTask, archiveTrackerTask, setPendingTaskDelete, showArchivedTasks, setShowArchivedTasks, restoreArchivedTask, quickAddTrackerTask, quickAddMessage }) {
  const [taskView, setTaskView] = React.useState("today");
  const [composerOpen, setComposerOpen] = React.useState(false);
  const [plushHappy, setPlushHappy] = React.useState(false);
  const plushTimer = React.useRef(null);
  const { unifiedToggle } = useCompletedTaskFlow(toggle, viewDone, rows);
  const cheer = () => {
    setPlushHappy(true);
    if (plushTimer.current) window.clearTimeout(plushTimer.current);
    plushTimer.current = window.setTimeout(() => setPlushHappy(false), 2200);
  };
  React.useEffect(() => () => { if (plushTimer.current) window.clearTimeout(plushTimer.current); }, []);
  React.useEffect(() => { if (open) { setTaskView(initialView); setComposerOpen(!inline); } }, [open, inline, initialView, viewRequest]);
  if (!open) return null;
  const { DAYS, TEMPLATE_PACKS } = window.PlushLifeContent;
  const { WEEKDAY_PRESET_IDS, WEEKEND_PRESET_IDS, scheduleLabelForTask, taskIsScheduledForDate, offsetDate } = window.PlushLifeSchedule;
  const scrollToFullForm = () => {
    setComposerOpen(true);
    window.requestAnimationFrame(() => document.getElementById("plushlife-full-task-form")?.scrollIntoView?.({ behavior: "auto", block: "start" }));
  };
  return (
          <ToolPanel title="🌷 Add & organize" displayTitle="Tasks" inline={inline} hideClose={inline} onClose={onClose}>
          <div className="pl-task-page">
            <div className="pl-design-tabs" role="tablist" aria-label="Task views">
              {[["today", "Today"], ["later", "Later"], ["habits", "Habits"]].map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={taskView === id} onClick={() => setTaskView(id)}>{label}</button>)}
            </div>
            <section className="pl-design-card" aria-label="Your task list">
              <div className="pl-task-title"><button type="button" className={`pl-mascot-pat ${plushHappy ? "pl-mascot-happy-hop" : ""}`} onClick={cheer} aria-label="Say hi to your plush"><ThemeScene focus decorative mood={plushHappy ? "happy" : "neutral"} /></button><h2>{taskView === "habits" ? "Your gentle routines" : taskView === "later" ? "Another day is okay" : "Your little list"}</h2></div>
              <p className="pl-design-caption">No need to do everything. Moving a task is allowed.</p>
              <input value={taskSearchQuery} onChange={(event) => setTaskSearchQuery(event.target.value)} placeholder="Search your little list" aria-label="Search today's tasks" />
              {(() => {
                const query = taskSearchQuery.trim().toLowerCase();
                const visible = taskView === "later"
                  ? trackerTasks.filter(task => !task.archived_at && !taskIsScheduledForDate(task, selectedProgressDate || period.date) && (task.one_time_date > (selectedProgressDate || period.date) || Array.from({length:7}, (_, index) => offsetDate(selectedProgressDate || period.date, index + 1)).some(date => taskIsScheduledForDate(task, date)))).map(task => ({ key: task.task_key, label: task.task, sourceTask: task, later: true }))
                  : rows.filter(row => row && (taskView !== "habits" || (row.habitType || row.sourceTask?.habit_type || "regular") !== "regular"));
                const matching = visible.filter(row => String(row.label || "").toLowerCase().includes(query));
                return matching.length ? matching.map(row => <div className="pl-design-task" key={row.key}>
                  <button type="button" className="pl-task-toggle" aria-label={row.later ? `Edit ${row.label}` : `${viewDone[row.key] ? "Undo" : "Complete"} ${row.label}`} aria-pressed={row.later ? undefined : !!viewDone[row.key]} onClick={() => { if (row.later) { startEditingTask(row.sourceTask); return; } if (!viewDone[row.key]) cheer(); unifiedToggle(row.key); }}>
                    <span className={`pl-task-box ${!row.later && viewDone[row.key] ? "is-done" : ""}`} aria-hidden="true">{!row.later && viewDone[row.key] ? "✓" : ""}</span>
                    <span><strong>{row.label}</strong><HabitGoalCaption taskKey={row.key}/><small>{row.later ? scheduleLabelForTask(row.sourceTask) : row.sourceTask?.estimated_minutes ? `${row.sourceTask.estimated_minutes} minutes · At your pace` : "One little step"}</small></span>
                  </button>
                  {row.sourceTask && <button type="button" className="pl-task-edit" onClick={() => startEditingTask(row.sourceTask)} aria-label={`Edit ${row.label}`}>•••</button>}
                </div>) : <p className="pl-design-empty">{query ? "No tasks match that search." : taskView === "today" ? "Your list has room to breathe. Add your first little task below." : "Nothing here yet. A small start is enough."}</p>;
              })()}
            </section>
            {taskView === "habits" && <HabitStudio/>}
            <button type="button" className="pl-design-primary" aria-expanded={composerOpen} onClick={() => setComposerOpen(value => !value)}>Add a task</button>
            <details className="pl-task-composer" open={composerOpen} onToggle={event => setComposerOpen(event.currentTarget.open)}>
              <summary>Add & shape a little task</summary>
          <QuickCapture onQuickAdd={quickAddTrackerTask} quickAddMessage={quickAddMessage} onMoreOptions={scrollToFullForm} />
          <div style={{ marginBottom: 14, padding: 16, borderRadius: 18, background: "var(--pl-theme-surface)", border: "1px solid var(--pl-theme-line,#E9DDF6)", boxShadow: "0 8px 22px rgba(103,65,122,.06), inset 0 1px 0 rgba(255,255,255,.9)" }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: "var(--pl-theme-ink,#76558A)" }}>PICK A COZY SPOT</div>
            <div style={{ marginTop: 5, fontSize: 11.5, lineHeight: 1.45, color: "var(--pl-theme-muted,#7B6888)" }}>Choose where this belongs. PlushLife will keep the rest tidy for you.</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 7, marginTop: 10 }}>
              {[{ id: "daily", label: "Every day" }, ...DAYS].map((item) => {
                const selected = newTaskDay === item.id;
                return (
                  <button key={item.id} type="button" aria-pressed={selected} onClick={() => {
                    const nextSections = taskSectionsForDay(item.id);
                    setNewTaskDay(item.id);
                    setNewTaskSection(nextSections[0] || "My tasks");
                    setNewTaskCustomSection("");
                  }} style={{ minWidth: 0, padding: "8px 5px", borderRadius: 11, border: selected ? "2px solid #A65DC1" : "1px solid #DCC9E8", background: selected ? "#F2DEFA" : "#FFFFFFCC", color: selected ? "#7E3D99" : "#6B5A7D", fontWeight: 900, fontSize: item.id === "daily" ? 10.5 : 11.5, cursor: "pointer" }}>
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom: 14, padding: 16, borderRadius: 16, background: "var(--pl-theme-surface)", border: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: "var(--pl-theme-ink,#318C79)" }}>✨ GENTLE STARTER PACKS</div>
            <div style={{ marginTop: 5, fontSize: 11.5, lineHeight: 1.45, color: "var(--pl-theme-muted,#6B7F78)" }}>Add a pack whenever you want. It only adds missing every-day tasks — your current list stays exactly as it is.</div>
            {(() => {
              const selectedPack = TEMPLATE_PACKS.find((pack) => pack.id === starterPackId) || TEMPLATE_PACKS[0];
              const existingTaskNames = new Set(trackerTasks.filter((item) => item.day_id === "daily" && !item.archived_at).map((item) => item.task.trim().toLocaleLowerCase()));
              const missingTasks = selectedPack.tasks.filter((item) => !existingTaskNames.has(item.task.trim().toLocaleLowerCase()));
              return <>
                <label style={{ display: "block", marginTop: 11, fontSize: 11, fontWeight: 900, color: "var(--pl-theme-ink,#3E746A)" }}>
                  Choose a starter pack
                  <select aria-label="Choose a starter pack" value={starterPackId} onChange={(event) => { setStarterPackId(event.target.value); setStarterPackMessage(""); }} style={{ width: "100%", marginTop: 5, padding: "10px 11px", borderRadius: 10, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "white", color: "var(--pl-theme-ink,#285F55)", fontWeight: 800, fontSize: 12.5 }}>
                    {TEMPLATE_PACKS.map((pack) => <option key={pack.id} value={pack.id}>{pack.emoji} {pack.label}</option>)}
                  </select>
                </label>
                <div style={{ marginTop: 10, padding: "10px 11px", borderRadius: 11, background: "white", border: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
                  <div style={{ fontSize: 11, fontWeight: 900, color: "var(--pl-theme-ink,#318C79)" }}>{missingTasks.length ? `This will add ${missingTasks.length} missing ${missingTasks.length === 1 ? "task" : "tasks"}` : "You already have every task in this pack"}</div>
                  {missingTasks.length > 0 && <div style={{ marginTop: 6, display: "grid", gap: 4, fontSize: 11.5, lineHeight: 1.35, color: "var(--pl-theme-ink,#5E766F)" }}>{missingTasks.map((item) => <div key={item.task}>○ {item.task}</div>)}</div>}
                </div>
                <button type="button" disabled={missingTasks.length === 0} onClick={addStarterPack} style={{ marginTop: 9, padding: "8px 12px", borderRadius: 10, border: 0, background: missingTasks.length ? "#318C79" : "#AFC8C1", color: "white", fontWeight: 900, cursor: missingTasks.length ? "pointer" : "not-allowed" }}>Add {selectedPack.label}</button>
              </>;
            })()}
            {starterPackMessage && <div role={starterPackMessage.includes("Couldn't") ? "alert" : "status"} aria-live="polite" style={{ marginTop: 8, fontSize: 11.5, lineHeight: 1.45, color: starterPackMessage.includes("Couldn't") ? "#B24D65" : "#318C79", fontWeight: 700 }}>{starterPackMessage}</div>}
          </div>

          <div style={{ marginBottom: 14, padding: 16, borderRadius: 16, background: "rgba(255,255,255,0.72)", border: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
            <button type="button" onClick={() => setImportOpen((open) => !open)} aria-expanded={importOpen} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: 0, padding: 0, cursor: "pointer" }}>
              <span style={{ fontSize: 13, fontWeight: 900, color: "var(--pl-theme-muted,#9A57AC)" }}>📥 Import a list of tasks</span>
              <span style={{ color: "var(--pl-theme-muted,#9A57AC)", fontSize: 12, transform: importOpen ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▾</span>
            </button>
            {importOpen && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 11.5, color: "var(--pl-theme-muted,#7B6888)", lineHeight: 1.45 }}>Paste one task per line — switching from another app? Just paste your list here. They'll all go into "{newTaskDay === "daily" ? "Every day" : DAYS.find((d) => d.id === newTaskDay)?.label}" under {newTaskSection || "your first section"}.</div>
                <textarea value={importText} onChange={(event) => setImportText(event.target.value)} placeholder={"Drink water\nTake medication\nStretch for 5 minutes"} style={{ width: "100%", boxSizing: "border-box", minHeight: 90, marginTop: 8, padding: 9, borderRadius: 10, border: "1px solid var(--pl-theme-line,#E9DDF6)", resize: "vertical" }} />
                <button type="button" onClick={importTasksFromText} style={{ marginTop: 8, padding: "8px 12px", borderRadius: 10, border: 0, background: "var(--pl-theme-accent)", color: "white", fontWeight: 900, cursor: "pointer" }}>Import tasks</button>
                {importMessage && <div style={{ marginTop: 8, fontSize: 12, color: "var(--pl-theme-muted,#8C6B9E)" }}>{importMessage}</div>}
              </div>
            )}
          </div>
          <div id="plushlife-full-task-form" style={{ marginBottom: 18, padding: 16, borderRadius: 16, background: "rgba(255,255,255,0.72)", border: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: "var(--pl-theme-muted,#A65DC1)" }}>ADD ONE LITTLE THING</div>
            <label style={{ display: "grid", gap: 4, marginTop: 10, fontSize: 10.5, fontWeight: 900, color: "var(--pl-theme-muted,#7D668C)" }}>
              TASK NAME
              <input ref={newTaskNameInputRef} value={newTaskName} onChange={(event) => { setNewTaskName(event.target.value); if (taskMessage === "Give the task a name first.") setTaskMessage(""); }} maxLength={240} placeholder="Example: Brush my teeth" aria-label="New task name" aria-invalid={taskMessage === "Give the task a name first."} aria-describedby={taskMessage ? "task-form-message" : undefined} style={{ width: "100%", boxSizing: "border-box", padding: 9, borderRadius: 10, border: taskMessage === "Give the task a name first." ? "2px solid #C45D74" : "1px solid #E3C9EC" }} />
            </label>
            <div style={{ marginTop: 8, padding: 10, borderRadius: 12, background: "var(--pl-theme-surface)", border: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
              <label style={{ display: "grid", gap: 4, fontSize: 10.5, fontWeight: 900, color: "var(--pl-theme-muted,#7B5D89)" }}>
                SAY WHEN IT SHOULD HAPPEN · OPTIONAL
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  <input value={naturalScheduleText} onChange={(event) => { setNaturalScheduleText(event.target.value); setNaturalSchedulePreview(null); }} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); applyNaturalSchedule(); } }} placeholder="Weekdays at 8 PM" aria-label="Schedule in everyday language" style={{ flex: "1 1 190px", minWidth: 0, padding: 9, borderRadius: 9, border: "1px solid var(--pl-theme-line,#E9DDF6)" }} />
                  <button type="button" onClick={applyNaturalSchedule} style={{ padding: "8px 11px", borderRadius: 9, border: 0, background: "var(--pl-theme-accent)", color: "white", fontWeight: 900, cursor: "pointer" }}>Read it</button>
                </div>
              </label>
              {naturalSchedulePreview && (
                <div role="status" aria-live="polite" style={{ marginTop: 7, fontSize: 11.5, lineHeight: 1.45, color: naturalSchedulePreview.recognized ? "#2D6BB5" : "#9A6673" }}>
                  {naturalSchedulePreview.recognized ? `✓ I understood: ${naturalSchedulePreview.summary}` : naturalSchedulePreview.summary}
                </div>
              )}
              <div style={{ marginTop: 5, fontSize: 10.5, color: "var(--pl-theme-muted,#6B7C99)" }}>Try “every day at 8 AM,” “Tuesday and Friday,” “weekdays,” or “tomorrow at 6 PM.” You always review it before saving.</div>
            </div>
            <label style={{ display: "grid", gap: 4, marginTop: 7, fontSize: 10.5, fontWeight: 900, color: "var(--pl-theme-muted,#7D668C)" }}>
              GROUP
              <select value={newTaskSection} onChange={(event) => setNewTaskSection(event.target.value)} aria-label="Choose section" style={{ width: "100%", minWidth: 0, boxSizing: "border-box", padding: 9, borderRadius: 10, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "white" }}>
                {newTaskSectionOptions.map((section) => <option key={section} value={section}>{section}</option>)}
                {newTaskSectionOptions.length === 0 && <option value="My tasks">My tasks</option>}
                <option value="__custom__">＋ Create a custom section…</option>
              </select>
            </label>
            {newTaskSection === "__custom__" && <input value={newTaskCustomSection} onChange={(event) => setNewTaskCustomSection(event.target.value)} maxLength={120} aria-label="New section name" placeholder="Name your new section" style={{ width: "100%", boxSizing: "border-box", marginTop: 7, padding: 9, borderRadius: 10, border: "1px solid var(--pl-theme-line,#E9DDF6)" }} />}
            <div style={{ marginTop: 7, padding: "8px 10px", borderRadius: 9, background: "var(--pl-theme-surface-2,#EEF9F6)", border: "1px solid var(--pl-theme-line,#E9DDF6)", color: "var(--pl-theme-ink,#318C79)", fontSize: 11.5, fontWeight: 900 }}>
              ✓ Goes to: {(newTaskDay === "daily" ? "Every day" : DAYS.find((item) => item.id === newTaskDay)?.label) || newTaskDay.toUpperCase()} → {newTaskSection === "__custom__" ? (newTaskCustomSection.trim() || "your new section") : (newTaskSection || "My tasks")}
            </div>

            <button type="button" onClick={() => setTaskAdvancedOpen((open) => !open)} aria-expanded={taskAdvancedOpen} style={{ marginTop: 10, padding: "6px 10px", borderRadius: 9, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: taskAdvancedOpen ? "#F8EFFB" : "white", color: "var(--pl-theme-muted,#7D668C)", fontWeight: 800, fontSize: 11.5, cursor: "pointer" }}>
              ⚙️ More options — habit type, repeat schedule, why it matters {taskAdvancedOpen ? "▾" : "▸"}
            </button>
            {taskAdvancedOpen && (
              <div style={{ marginTop: 8, display: "grid", gap: 8 }}>
                <label style={{ display: "grid", gap: 4, fontSize: 10.5, fontWeight: 900, color: "var(--pl-theme-muted,#7D668C)" }}>
                  WHY DOES THIS MATTER TO YOU? · OPTIONAL
                  <input value={newTaskWhy} onChange={(event) => setNewTaskWhy(event.target.value)} maxLength={300} placeholder="e.g. So I have energy for the people I love" aria-label="Why this task matters" style={{ width: "100%", boxSizing: "border-box", padding: 9, borderRadius: 10, border: "1px solid var(--pl-theme-line,#E9DDF6)" }} />
                </label>
                <div style={{ padding: 11, borderRadius: 12, background: "var(--pl-theme-surface-2,#F4FBF8)", border: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
                  <div style={{ fontSize: 10.5, fontWeight: 900, color: "var(--pl-theme-ink,#318C79)" }}>VERSIONS FOR DIFFERENT KINDS OF DAYS · OPTIONAL</div>
                  <div style={{ marginTop: 4, fontSize: 11.5, lineHeight: 1.45, color: "var(--pl-theme-muted,#6B7F78)" }}>Keep the main name as the Full version. Add smaller versions so PlushLife can adapt without erasing the goal.</div>
                  <input value={newTaskSoftLabel} onChange={(event) => setNewTaskSoftLabel(event.target.value)} maxLength={240} placeholder="Soft version — e.g. Take a quick shower" aria-label="Soft task version" style={{ width: "100%", boxSizing: "border-box", marginTop: 8, padding: 9, borderRadius: 9, border: "1px solid var(--pl-theme-line,#E9DDF6)" }} />
                  <input value={newTaskTinyLabel} onChange={(event) => setNewTaskTinyLabel(event.target.value)} maxLength={240} placeholder="Tiny version — e.g. Wash my face" aria-label="Tiny task version" style={{ width: "100%", boxSizing: "border-box", marginTop: 7, padding: 9, borderRadius: 9, border: "1px solid var(--pl-theme-line,#E9DDF6)" }} />
                  <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1.5fr)", gap: 7, marginTop: 7, alignItems: "center" }}>
                    <input type="number" min="1" max="1440" value={newTaskEstimatedMinutes} onChange={(event) => setNewTaskEstimatedMinutes(event.target.value)} placeholder="Minutes" aria-label="Estimated minutes" style={{ minWidth: 0, padding: 9, borderRadius: 9, border: "1px solid var(--pl-theme-line,#E9DDF6)" }} />
                    <label style={{ display: "flex", gap: 7, alignItems: "center", fontSize: 11.5, color: "var(--pl-theme-ink,#5E766F)" }}><input type="checkbox" checked={newTaskEssentialOnLow} onChange={(event) => setNewTaskEssentialOnLow(event.target.checked)} /> Keep on Tiny and Recovery days</label>
                  </div>
                </div>
                <label style={{ display: "grid", gap: 4, fontSize: 10.5, fontWeight: 900, color: "var(--pl-theme-muted,#7D668C)" }}>
                  WHAT KIND OF TASK IS THIS?
                  <select value={newTaskKind} onChange={(event) => setNewTaskKind(event.target.value)} aria-label="Choose task kind" style={{ width: "100%", padding: 9, borderRadius: 10, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "white" }}>
                    <option value="regular">Regular task</option>
                    <option value="build">🌱 Build a habit</option>
                    <option value="reduce">🍂 Reduce a habit</option>
                  </select>
                </label>
                {newTaskKind !== "regular" && (
                  <div style={{ padding: "8px 10px", borderRadius: 9, background: "var(--pl-theme-surface-2,#FFF9E9)", border: "1px solid var(--pl-theme-line,#E9DDF6)", color: "var(--pl-theme-ink,#8A6A21)", fontSize: 11.5, lineHeight: 1.45 }}>
                    Each successful check-in adds to your lifetime progress and unlocks habit badges at 1, 3, 7, 14, and 30 total check-ins. Missing a day never sets that progress back.
                  </div>
                )}
                <label style={{ display: "grid", gap: 4, fontSize: 10.5, fontWeight: 900, color: "var(--pl-theme-muted,#7D668C)" }}>
                  HOW OFTEN SHOULD IT COME BACK?
                  <select value={newTaskScheduleType} onChange={(event) => setNewTaskScheduleType(event.target.value)} aria-label="Choose repeating schedule" style={{ width: "100%", padding: 9, borderRadius: 10, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "white" }}>
                    <option value="weekly">Every week</option>
                    <option value="range">Only between two dates</option>
                    <option value="once">Only one time</option>
                  </select>
                </label>
                {newTaskScheduleType === "weekly" && (
                  <div style={{ padding: 9, borderRadius: 10, background: "var(--pl-theme-surface,#FAF7FC)", border: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
                    <div style={{ fontSize: 10.5, fontWeight: 900, color: "var(--pl-theme-muted,#7D668C)" }}>SPECIFIC DAYS · OPTIONAL</div>
                    <div style={{ display: "flex", gap: 5, marginTop: 7 }}>
                      {[["Weekdays", WEEKDAY_PRESET_IDS], ["Weekend", WEEKEND_PRESET_IDS]].map(([presetLabel, presetDays]) => {
                        const active = presetDays.length === newTaskScheduleDays.length && presetDays.every((id) => newTaskScheduleDays.includes(id));
                        return <button key={presetLabel} type="button" aria-pressed={active} onClick={() => setNewTaskScheduleDays(active ? [] : presetDays)} style={{ flex: 1, padding: "6px 4px", borderRadius: 8, border: active ? "2px solid #A65DC1" : "1px solid #DCC9E8", background: active ? "#F2DEFA" : "white", color: active ? "#7E3D99" : "#6B5A7D", fontWeight: 900, fontSize: 10.5, cursor: "pointer" }}>{presetLabel}</button>;
                      })}
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 5, marginTop: 7 }}>
                      {DAYS.map((item) => {
                        const selected = newTaskScheduleDays.includes(item.id);
                        return <button key={item.id} type="button" aria-pressed={selected} onClick={() => setNewTaskScheduleDays((days) => selected ? days.filter((id) => id !== item.id) : [...days, item.id])} style={{ minWidth: 0, padding: "7px 2px", borderRadius: 8, border: selected ? "2px solid #A65DC1" : "1px solid #DCC9E8", background: selected ? "#F2DEFA" : "white", color: selected ? "#7E3D99" : "#6B5A7D", fontWeight: 900, fontSize: 10, cursor: "pointer" }}>{item.label.slice(0, 3)}</button>;
                      })}
                    </div>
                    <div style={{ marginTop: 5, fontSize: 10.5, color: "var(--pl-theme-muted,#8C6B9E)" }}>{newTaskScheduleDays.length ? "Only appears on the selected days." : "No days selected: uses the list chosen in Step 1."}</div>
                  </div>
                )}
                <label style={{ display: "grid", gap: 4, fontSize: 10.5, fontWeight: 900, color: "var(--pl-theme-muted,#7D668C)" }}>
                  TASK REMINDER TIME · OPTIONAL
                  <input type="time" value={newTaskReminderTime} onChange={(event) => setNewTaskReminderTime(event.target.value)} aria-label="Task reminder time" style={{ width: "100%", boxSizing: "border-box", padding: 9, borderRadius: 10, border: "1px solid var(--pl-theme-line,#E9DDF6)" }} />
                </label>
                {newTaskScheduleType === "range" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
                    <label style={{ fontSize: 11.5, fontWeight: 800 }}>Starts<input type="date" value={newTaskStartDate} onChange={(event) => setNewTaskStartDate(event.target.value)} style={{ width: "100%", boxSizing: "border-box", marginTop: 4, padding: 8, borderRadius: 9, border: "1px solid var(--pl-theme-line,#E9DDF6)" }} /></label>
                    <label style={{ fontSize: 11.5, fontWeight: 800 }}>Ends<input type="date" value={newTaskEndDate} onChange={(event) => setNewTaskEndDate(event.target.value)} style={{ width: "100%", boxSizing: "border-box", marginTop: 4, padding: 8, borderRadius: 9, border: "1px solid var(--pl-theme-line,#E9DDF6)" }} /></label>
                  </div>
                )}
                {newTaskScheduleType === "once" && (
                  <label style={{ display: "block", fontSize: 11.5, fontWeight: 800 }}>Task date<input type="date" value={newTaskOneTimeDate || selectedProgressDate} onChange={(event) => setNewTaskOneTimeDate(event.target.value)} style={{ width: "100%", boxSizing: "border-box", marginTop: 4, padding: 8, borderRadius: 9, border: "1px solid var(--pl-theme-line,#E9DDF6)" }} /></label>
                )}
              </div>
            )}
            <button onClick={addTrackerTask} style={{ marginTop: 10, padding: "9px 13px", borderRadius: 10, border: 0, background: "var(--pl-theme-accent,#A65DC1)", color: "white", fontWeight: 900, cursor: "pointer" }}>Add this task ✨</button>
            {SUPPORTER_FEATURES_ENABLED && !isSupporterAccount && (
              <div style={{ marginTop: 8, fontSize: 11, color: "var(--pl-theme-muted,#8C6B9E)" }}>
                {trackerTasks.filter((item) => item.day_id === "daily" || item.day_id === newTaskDay).length}/{FREE_TASK_LIMIT_PER_DAY} tasks used for this day on the free plan · 🌟 Supporters get unlimited
              </div>
            )}
            {taskMessage && <div id="task-form-message" role={taskMessage.includes("first") || taskMessage.includes("Couldn't") ? "alert" : "status"} aria-live="polite" style={{ marginTop: 8, fontSize: 12, color: taskMessage.includes("first") || taskMessage.includes("Couldn't") ? "#B24D65" : "#8C6B9E", fontWeight: taskMessage.includes("first") ? 800 : 600 }}>{taskMessage}</div>}
          </div>
            </details>
            <details className="pl-task-management"><summary>Manage routines, lists & archived tasks</summary>
          <div style={{ marginBottom: 18, padding: 16, borderRadius: 16, background: "rgba(255,255,255,0.82)", border: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
            <div style={{ fontSize: 13, fontWeight: 900, color: "var(--pl-theme-ink,#318C79)" }}>MANAGE MY {(newTaskDay === "daily" ? "EVERY DAY" : DAYS.find((day) => day.id === newTaskDay)?.label || newTaskDay.toUpperCase())} TASKS</div>
            <input value={taskSearchQuery} onChange={(event) => setTaskSearchQuery(event.target.value)} placeholder="🔎 Search all your tasks by name…" aria-label="Search tasks" style={{ width: "100%", boxSizing: "border-box", marginTop: 8, padding: 9, borderRadius: 10, border: "1px solid var(--pl-theme-line,#E9DDF6)" }} />
            {(() => {
              const query = taskSearchQuery.trim().toLowerCase();
              const isSearching = query.length > 0;
              const visibleTasks = isSearching
                ? trackerTasks.filter((task) => !task.archived_at && task.task.toLowerCase().includes(query))
                : trackerTasks.filter((task) => !task.archived_at && task.day_id === newTaskDay);
              if (visibleTasks.length === 0) {
                return <div style={{ marginTop: 10, padding: 10, borderRadius: 10, background: "var(--pl-theme-surface-2,#F4FAF8)", color: "var(--pl-theme-muted,#6B7F78)", fontSize: 12 }}>{isSearching ? "No tasks match that search." : "No tasks are saved for this list yet. Add a task or choose another day."}</div>;
              }
              const groupedTasks = [...visibleTasks]
                .sort((a, b) => (a.section || "").localeCompare(b.section || "") || Number(a.sort_order) - Number(b.sort_order))
                .reduce((groups, task) => {
                  const section = task.section || "My tasks";
                  if (!groups.has(section)) groups.set(section, []);
                  groups.get(section).push(task);
                  return groups;
                }, new Map());
              return (
                <div data-plushlife-task-drag-scope style={{ display: "grid", gap: 10, marginTop: 11 }}>
                  {!isSearching && <div style={{ padding: "8px 10px", borderRadius: 10, background: "var(--pl-theme-surface-2,#F8F2FB)", border: "1px solid var(--pl-theme-line,#E9DDF6)", color: "var(--pl-theme-ink,#76558A)", fontSize: 11.5, lineHeight: 1.45, userSelect: "none", WebkitUserSelect: "none" }}>↕️ <strong>Drag the ⋮⋮ handle</strong> to move a task to another group or position. Changes save automatically.</div>}
                  {[...groupedTasks.entries()].map(([section, sectionTasks]) => (
                    <section
                      key={section}
                      data-plushlife-task-drop-section={section}
                      style={{ padding: 9, borderRadius: 14, background: "var(--pl-theme-surface,#FAF7FC)", border: "1px solid var(--pl-theme-line,#E9DDF6)" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, margin: "0 2px 7px" }}>
                        <div style={{ fontSize: 11, fontWeight: 900, color: "var(--pl-theme-ink,#76558A)", letterSpacing: ".06em", overflowWrap: "anywhere", userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" }}>{section.toUpperCase()}</div>
                        <div style={{ fontSize: 10, color: "var(--pl-theme-muted,#9A86A7)" }}>{sectionTasks.length} {sectionTasks.length === 1 ? "task" : "tasks"}</div>
                      </div>
                      <div data-plushlife-task-row-container style={{ display: "grid", gap: 7 }}>
                        {sectionTasks.map((task) => (
                          <div
                            key={task.task_key}
                            data-plushlife-task-drop-key={task.task_key}
                            data-plushlife-task-drop-label={task.task}
                            data-plushlife-task-drop-section={section}
                            style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "9px 10px", borderRadius: 11, background: "#FFFFFFD9", border: isTaskPausedOnDate(task, period.date) ? "1px solid #E9C96E" : "1px solid #DDEBE7", userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none", transition: "transform .12s ease, box-shadow .12s ease" }}
                          >
                            {!isSearching && <button
                              type="button"
                              draggable={false}
                              aria-label={`Reorder ${task.task}`}
                              title="Drag to move"
                              onClick={(event) => { event.preventDefault(); event.stopPropagation(); }}
                              onPointerDown={(event) => startPointerTaskDrag(event, task.task_key, task.task)}
                              onPointerMove={movePointerTaskDrag}
                              onPointerUp={endPointerTaskDrag}
                              onPointerCancel={cancelPointerTaskDrag}
                              onContextMenu={(event) => event.preventDefault()}
                              onSelect={(event) => event.preventDefault()}
                              style={{ flex: "0 0 auto", width: 30, height: 34, minHeight: 34, padding: 0, borderRadius: 8, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface,#FBF7FD)", color: "var(--pl-theme-ink,#76558A)", fontWeight: 900, fontSize: 15, lineHeight: 1, cursor: "grab", touchAction: "none", userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
                            >⋮⋮</button>}
                            <div style={{ flex: "1 1 160px", minWidth: 0 }}>
                              <div style={{ fontSize: 12.5, fontWeight: 900, color: "var(--pl-theme-ink,#5B4B6B)", overflowWrap: "anywhere" }}><HabitTypeIcon task={task} />{task.task}{isTaskPausedOnDate(task, period.date) && <span style={{ marginLeft: 6, padding: "2px 7px", borderRadius: 999, background: "var(--pl-theme-surface-2,#FFFBF2)", color: "var(--pl-theme-ink,#A56D14)", fontSize: 10, fontWeight: 900 }}>⏸ PAUSED{task.paused_until ? ` UNTIL ${task.paused_until}` : ""}</span>}</div>
                              <div style={{ marginTop: 2, fontSize: 10.5, color: "var(--pl-theme-muted,#8C6B9E)" }}>{scheduleLabelForTask(task)} · {task.section || "My tasks"}</div>
                            </div>
                            {!isSearching && taskSectionsForDay(task.day_id).length > 1 && <select
                              defaultValue=""
                              aria-label={`Move ${task.task} to another group`}
                              onChange={(event) => {
                                const targetSection = event.target.value;
                                event.target.value = "";
                                if (targetSection) moveTaskToSection(task.task_key, targetSection);
                              }}
                              style={{ maxWidth: 120, padding: "6px 7px", borderRadius: 8, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "white", color: "var(--pl-theme-ink,#76558A)", fontWeight: 800, fontSize: 10.5 }}
                            >
                              <option value="">Move to…</option>
                              {taskSectionsForDay(task.day_id).filter((name) => name !== task.section).map((name) => <option key={name} value={name}>{name}</option>)}
                            </select>}
                            <button type="button" onClick={() => startEditingTask(task)} aria-label={`Edit ${task.task}`} style={{ padding: "6px 9px", borderRadius: 8, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface,#F7FBFF)", color: "var(--pl-theme-muted,#4C8FE8)", fontWeight: 900, cursor: "pointer" }}>✏️ Edit</button>
                            {isTaskPausedOnDate(task, period.date) ? (
                              <button type="button" onClick={() => resumeTrackerTask(task.task_key)} aria-label={`Resume ${task.task}`} style={{ padding: "6px 9px", borderRadius: 8, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface-2,#F4FBF8)", color: "var(--pl-theme-ink,#318C79)", fontWeight: 900, cursor: "pointer" }}>▶️ Resume</button>
                            ) : (
                              <button type="button" onClick={() => pauseTrackerTask(task.task_key)} aria-label={`Pause ${task.task}`} style={{ padding: "6px 9px", borderRadius: 8, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface-2,#FFFBF2)", color: "var(--pl-theme-ink,#9A6918)", fontWeight: 900, cursor: "pointer" }}>⏸ Pause</button>
                            )}
                            <button type="button" onClick={() => archiveTrackerTask(task.task_key)} aria-label={`Archive ${task.task}`} style={{ padding: "6px 9px", borderRadius: 8, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface-2,#FFFBF2)", color: "var(--pl-theme-ink,#9A6918)", fontWeight: 900, cursor: "pointer" }}>📦 Archive</button>
                            <button type="button" onClick={() => setPendingTaskDelete({ key: task.task_key, label: task.task, section: task.section })} aria-label={`Delete ${task.task}`} style={{ padding: "6px 9px", borderRadius: 8, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface,#FFF7F9)", color: "var(--pl-theme-muted,#C45D74)", fontWeight: 900, cursor: "pointer" }}>🗑️ Delete</button>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              );
            })()}
            {trackerTasks.some((task) => task.archived_at) && (
              <div style={{ marginTop: 12, paddingTop: 10, borderTop: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
                <button type="button" onClick={() => setShowArchivedTasks((shown) => !shown)} aria-expanded={showArchivedTasks} style={{ padding: "6px 9px", borderRadius: 9, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "white", color: "var(--pl-theme-ink,#76558A)", fontWeight: 900, fontSize: 11.5, cursor: "pointer" }}>📦 {showArchivedTasks ? "Hide" : "Show"} archived tasks ({trackerTasks.filter((task) => task.archived_at).length})</button>
                {showArchivedTasks && <div style={{ display: "grid", gap: 7, marginTop: 8 }}>
                  {trackerTasks.filter((task) => task.archived_at).sort((a, b) => String(b.archived_at).localeCompare(String(a.archived_at))).map((task) => (
                    <div key={task.task_key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, background: "var(--pl-theme-surface,#FAF7FC)", border: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
                      <div style={{ flex: 1, minWidth: 0 }}><div style={{ fontSize: 12, fontWeight: 900, color: "var(--pl-theme-ink,#6B5A7D)" }}>{task.task}</div><div style={{ marginTop: 2, fontSize: 10.5, color: "var(--pl-theme-muted,#9A86A7)" }}>History preserved · no longer scheduled</div></div>
                      <button type="button" onClick={() => restoreArchivedTask(task.task_key)} aria-label={`Restore ${task.task}`} style={{ padding: "6px 9px", borderRadius: 8, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface-2,#F4FBF8)", color: "var(--pl-theme-ink,#318C79)", fontWeight: 900, cursor: "pointer" }}>Restore</button>
                    </div>
                  ))}
                </div>}
              </div>
            )}
          </div>
            </details>
          </div>
          </ToolPanel>
  );
}
