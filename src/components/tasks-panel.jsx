import { openPlushGuardian } from "./plush-guardian.jsx";
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
import { ToolPanel, HabitTypeIcon, habitTypeForRow } from "./shared.jsx";
import { QuickCapture } from "./quick-capture.jsx";
import { RoutineStarter } from "./cozy-day-experience.jsx";
import { ThemeScene } from "./theme-world.jsx";
import { useCompletedTaskFlow } from "./completed-task-flow.jsx";

export function TasksPanel({ open, onClose, inline = false, initialView = "today", viewRequest = 0, rows = [], viewDone = {}, toggle, newTaskDay, setNewTaskDay, taskSectionsForDay, setNewTaskSection, setNewTaskCustomSection, starterPackId, setStarterPackId, trackerTasks, setStarterPackMessage, addStarterPack, starterPackMessage, importOpen, setImportOpen, newTaskSection, importText, setImportText, importTasksFromText, importMessage, selectedProgressDate, taskSearchQuery, setTaskSearchQuery, isTaskPausedOnDate, period, startPointerTaskDrag, movePointerTaskDrag, endPointerTaskDrag, cancelPointerTaskDrag, moveTaskToSection, startEditingTask, resumeTrackerTask, pauseTrackerTask, archiveTrackerTask, setPendingTaskDelete, showArchivedTasks, setShowArchivedTasks, restoreArchivedTask, quickAddTrackerTask, quickAddMessage, onOpenSchedule }) {
  const [taskView, setTaskView] = React.useState("today");
  const [showAllToday, setShowAllToday] = React.useState(false);
  const [plushHappy, setPlushHappy] = React.useState(false);
  const plushTimer = React.useRef(null);
  const { unifiedToggle } = useCompletedTaskFlow(toggle, viewDone, rows);
  const cheer = () => {
    setPlushHappy(true);
    if (plushTimer.current) window.clearTimeout(plushTimer.current);
    plushTimer.current = window.setTimeout(() => setPlushHappy(false), 2200);
  };
  React.useEffect(() => () => { if (plushTimer.current) window.clearTimeout(plushTimer.current); }, []);
  React.useEffect(() => { if (open) { setTaskView(initialView); setShowAllToday(false); } }, [open, inline, initialView, viewRequest]);
  React.useEffect(() => {
    if (!open) return undefined;
    const showCapture = () => {
      window.requestAnimationFrame(() => document.querySelector('input[aria-label^="Quickly add a"]')?.focus?.());
    };
    window.addEventListener("plushlife:open-quick-add", showCapture);
    return () => window.removeEventListener("plushlife:open-quick-add", showCapture);
  }, [open]);
  if (!open) return null;
  const { DAYS, TEMPLATE_PACKS } = window.PlushLifeContent;
  const { WEEKDAY_PRESET_IDS, WEEKEND_PRESET_IDS, scheduleLabelForTask, taskIsScheduledForDate, offsetDate } = window.PlushLifeSchedule;
  return (
          <ToolPanel title="🌷 Add & organize" displayTitle="Tasks" inline={inline} hideClose={inline} onClose={onClose}>
          <div className="pl-task-page">
            {!inline && <div className="pl-edit-shortcuts pl-edit-shortcuts-tasks" role="group" aria-label="Manage tasks and schedule">
              <button type="button" onClick={() => { setTaskView("today"); setShowAllToday(true); }}>✏️ Show all tasks</button>
              <button type="button" onClick={onOpenSchedule}>📅 Edit schedule</button>
            </div>}
            {!inline && <div className="pl-design-tabs" role="tablist" aria-label="Task views">
              {[["today", "Today"], ["habits", "Habits"], ["later", "Later"]].map(([id, label]) => <button key={id} type="button" role="tab" aria-selected={taskView === id} onClick={() => setTaskView(id)}>{label}{id === "habits" ? ` (${trackerTasks.filter(task=>!task.archived_at && habitTypeForRow(task)!=="regular").length})` : ""}</button>)}
            </div>}
            <section className="pl-task-composer" aria-label={taskView === "habits" ? "Add a habit" : "Add a task"}>
              <h3>{taskView === "habits" ? "Add a habit" : "Add a task"}</h3>
              <QuickCapture key={taskView === "habits" ? "habit" : "task"} habit={taskView === "habits"} onQuickAdd={quickAddTrackerTask} quickAddMessage={quickAddMessage} />
            </section>
            <section className="pl-design-card" aria-label="Your task list">
              <div className="pl-task-title"><button type="button" className={`pl-mascot-pat ${plushHappy ? "pl-mascot-happy-hop" : ""}`} onClick={cheer} aria-label="Say hi to your plush"><ThemeScene focus decorative mood={plushHappy ? "happy" : "neutral"} /></button><h2>{taskView === "habits" ? "Habits" : taskView === "later" ? "Later" : "Tasks for the day"}</h2></div>
              <p className="pl-design-caption">{taskView === "habits" ? "Check off today’s habits. Other days stay here for when you need them." : taskView === "today" ? "Check things off, open details, or move them when the day changes." : "No need to do everything. Moving a task is allowed."}</p>
              {/* On the Plan tab, "Find anything" above already searches tasks, so
                  this list-only search is shown just when the task list opens as a popup. */}
              {!inline && <details style={{ marginTop: 8 }}>
                <summary style={{ cursor: "pointer", fontSize: 12, fontWeight: 800, color: "var(--pl-theme-muted,#806B8D)" }}>Find a task</summary>
                <input style={{ marginTop: 7 }} value={taskSearchQuery} onChange={(event) => setTaskSearchQuery(event.target.value)} placeholder="Search your little list" aria-label="Search today's tasks" />
              </details>}
              {(() => {
                const query = taskSearchQuery.trim().toLowerCase();
                const visible = taskView === "later"
                  ? trackerTasks.filter(task => !task.archived_at && !taskIsScheduledForDate(task, selectedProgressDate || period.date) && (task.one_time_date > (selectedProgressDate || period.date) || Array.from({length:7}, (_, index) => offsetDate(selectedProgressDate || period.date, index + 1)).some(date => taskIsScheduledForDate(task, date)))).map(task => ({ key: task.task_key, label: task.task, sourceTask: task, later: true }))
                  : taskView === "habits"
                    ? trackerTasks.filter(task => !task.archived_at && habitTypeForRow(task) !== "regular").map(task => ({ key: task.task_key, label: task.task, sourceTask: task, later: !rows.some(row => row.key === task.task_key) }))
                    : rows.filter(Boolean);
                const matching = visible.filter(row => String(row.label || "").toLowerCase().includes(query));
                const incompleteToday = taskView === "today" && !query ? matching.filter(row => !viewDone[row.key]) : matching;
                const displayRows = taskView === "today" && !query && !showAllToday ? incompleteToday.slice(0, 5) : matching;
                const hiddenCount = taskView === "today" && !query ? Math.max(0, matching.length - displayRows.length) : 0;
                if (!displayRows.length) return <p className="pl-design-empty">{query ? "No tasks match that search." : taskView === "today" && matching.length ? "You’re caught up for now ✨" : taskView === "today" ? "Your list has room to breathe. Add your first little task below." : "Nothing here yet. A small start is enough."}</p>;
                return <>
                  {displayRows.map(row => <div className="pl-design-task" key={row.key} data-habit-kind={habitTypeForRow(row)}>
                    <button type="button" className="pl-task-toggle" aria-label={row.later ? `Edit ${row.label || "Untitled task"}` : `${viewDone[row.key] ? "Undo" : "Complete"} ${row.label || "Untitled task"}`} aria-pressed={row.later ? undefined : !!viewDone[row.key]} onClick={() => { if (row.later) { startEditingTask(row.sourceTask); return; } if (!viewDone[row.key]) cheer(); unifiedToggle(row.key); }}>
                      <span className={`pl-task-box ${!row.later && viewDone[row.key] ? "is-done" : ""}`} aria-hidden="true">{!row.later && viewDone[row.key] ? "✓" : ""}</span>
                      <span><HabitTypeIcon task={row.sourceTask || row} habitType={habitTypeForRow(row)}/><strong>{row.label || "Untitled task"}</strong><HabitGoalCaption taskKey={row.key} fallbackGoal={row.goal}/><small>{row.later ? `Not due today · ${scheduleLabelForTask(row.sourceTask)}` : row.sourceTask?.estimated_minutes ? `${row.sourceTask.estimated_minutes} minutes · At your pace` : "One little step"}</small></span>
                    </button>
                    {row.sourceTask && (
                      <div className="pl-task-row-actions">
                        <button type="button" className="pl-task-edit-direct" aria-label={`Edit ${row.label || "Untitled task"}`} onClick={() => startEditingTask(row.sourceTask)}>✏️ Edit</button>
                        <details style={{ position: "relative", flex: "0 0 auto" }}>
                        <summary className="pl-task-edit" aria-label={`More options for ${row.label || "Untitled task"}`} style={{ listStyle: "none", cursor: "pointer", display: "grid", placeItems: "center" }}>⋯</summary>
                        <div style={{ position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 20, minWidth: 132, padding: 6, borderRadius: 11, background: "var(--pl-theme-surface,#FFF)", border: "1px solid var(--pl-theme-line,#E9DDF6)", boxShadow: "0 10px 26px rgba(74,45,94,.16)" }}>
                          <button type="button" onClick={() => openPlushGuardian("start",row.key)} style={{width:"100%",minHeight:44}}>Help me start</button>
                          <button type="button" onClick={() => setPendingTaskDelete({ key: row.sourceTask.task_key, label: row.sourceTask.task, section: row.sourceTask.section })} style={{ width: "100%", minHeight: 38, border: 0, borderRadius: 8, background: "transparent", textAlign: "left", color: "var(--pl-theme-muted,#C45D74)", fontWeight: 850, cursor: "pointer" }}>🗑️ Delete</button>
                        </div>
                        </details>
                      </div>
                    )}
                  </div>)}
                  {taskView === "today" && !query && matching.length > 5 && (
                    <button type="button" onClick={() => setShowAllToday(value => !value)} style={{ width: "100%", marginTop: 8, minHeight: 40, borderRadius: 12, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface-2,#F8F3FA)", color: "var(--pl-theme-ink,#5B4B6B)", fontWeight: 850, cursor: "pointer" }}>
                      {showAllToday ? "Show just 5" : `See the rest (${hiddenCount})`}
                    </button>
                  )}
                </>;
              })()}
            </section>
            {taskView === "habits" && <details className="pl-habit-tools"><summary>Goals, weekly review & routines · optional</summary><HabitStudio/></details>}
          <details className="pl-task-templates"><summary>Starter packs & import a list</summary>
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

          <RoutineStarter onChoose={template => {
            setNewTaskDay("daily");
            setImportText(template.tasks.join("\n"));
            setImportOpen(true);
            window.requestAnimationFrame(() => document.getElementById("pl-routine-import")?.scrollIntoView?.({ behavior: "smooth", block: "start" }));
          }} />
          <div id="pl-routine-import" style={{ marginBottom: 14, padding: 16, borderRadius: 16, background: "var(--pl-theme-surface)", border: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
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
          </details>
            <details className="pl-task-management"><summary>Manage saved tasks & archives</summary>
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
