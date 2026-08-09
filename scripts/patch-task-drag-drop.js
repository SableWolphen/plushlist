const fs = require('fs');

const path = 'index.html';
let src = fs.readFileSync(path, 'utf8');

if (src.includes('data-plushlife-task-drop-section')) {
  console.log('Task drag-and-drop is already patched.');
  process.exit(0);
}

const reorderPattern = /  const reorderTrackerTask = async \(sourceKey, targetKey\) => \{[\s\S]*?\n  \};\n\n  const startEditingTask/;
if (!reorderPattern.test(src)) throw new Error('Could not locate reorderTrackerTask block');

const movementBlock = `  const taskDragKeyRef = React.useRef(null);

  const reorderTrackerTask = async (sourceKey, targetKey) => {
    if (!sourceKey || !targetKey || sourceKey === targetKey) return;
    const source = trackerTasks.find((item) => item.task_key === sourceKey);
    const target = trackerTasks.find((item) => item.task_key === targetKey);
    if (!source || !target || source.day_id !== target.day_id || source.section !== target.section) return;
    const originalTasks = [...trackerTasks];
    const sectionTasks = trackerTasks
      .filter((item) => item.day_id === source.day_id && item.section === source.section)
      .sort((a, b) => a.sort_order - b.sort_order || a.task_key.localeCompare(b.task_key));
    const fromIndex = sectionTasks.findIndex((item) => item.task_key === sourceKey);
    const toIndex = sectionTasks.findIndex((item) => item.task_key === targetKey);
    if (fromIndex < 0 || toIndex < 0) return;

    const reordered = [...sectionTasks];
    const [moved] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, moved);
    const orderByKey = Object.fromEntries(reordered.map((item, index) => [item.task_key, index + 1]));
    setTrackerTasks((tasks) => tasks.map((item) => orderByKey[item.task_key] === undefined ? item : { ...item, sort_order: orderByKey[item.task_key] }));
    setTaskMessage("Saving new order…");

    const results = await Promise.all(reordered.map((item) =>
      supabase.from("tracker_tasks")
        .update({ sort_order: orderByKey[item.task_key] })
        .eq("user_id", user.id)
        .eq("task_key", item.task_key)
    ));
    if (results.some(({ error }) => error)) {
      setTrackerTasks(originalTasks);
      setTaskMessage("Couldn't save that order.");
      return;
    }
    setTaskMessage("Task moved ✨");
  };

  const moveTaskToSection = async (sourceKey, targetSection, targetKey = null) => {
    if (!sourceKey || !targetSection) return;
    const source = trackerTasks.find((item) => item.task_key === sourceKey);
    const target = targetKey ? trackerTasks.find((item) => item.task_key === targetKey) : null;
    if (!source || (target && target.day_id !== source.day_id)) return;
    if (target && target.section !== targetSection) return;
    if (source.section === targetSection && targetKey && sourceKey !== targetKey) {
      await reorderTrackerTask(sourceKey, targetKey);
      return;
    }
    if (source.section === targetSection && targetKey === sourceKey) return;

    const originalTasks = [...trackerTasks];
    const sourceSection = source.section;
    const sourceRemaining = trackerTasks
      .filter((item) => item.day_id === source.day_id && item.section === sourceSection && item.task_key !== sourceKey)
      .sort((a, b) => Number(a.sort_order) - Number(b.sort_order) || a.task_key.localeCompare(b.task_key));
    const targetTasks = trackerTasks
      .filter((item) => item.day_id === source.day_id && item.section === targetSection && item.task_key !== sourceKey)
      .sort((a, b) => Number(a.sort_order) - Number(b.sort_order) || a.task_key.localeCompare(b.task_key));
    const insertionIndex = targetKey
      ? Math.max(0, targetTasks.findIndex((item) => item.task_key === targetKey))
      : targetTasks.length;
    const moved = {
      ...source,
      section: targetSection,
      is_bonus: sectionIsOptional(source.day_id, targetSection),
    };
    targetTasks.splice(insertionIndex < 0 ? targetTasks.length : insertionIndex, 0, moved);

    const nextRows = [
      ...sourceRemaining.map((item, index) => ({ ...item, sort_order: index + 1 })),
      ...targetTasks.map((item, index) => ({ ...item, sort_order: index + 1 })),
    ];
    const nextByKey = new Map(nextRows.map((item) => [item.task_key, item]));
    setTrackerTasks((tasks) => tasks.map((item) => nextByKey.get(item.task_key) || item));
    setTaskMessage(sourceSection === targetSection ? "Saving new order…" : \`Moving to \${targetSection}…\`);

    const results = await Promise.all(nextRows.map((item) => {
      const update = item.task_key === sourceKey
        ? { section: targetSection, is_bonus: item.is_bonus, sort_order: item.sort_order }
        : { sort_order: item.sort_order };
      return supabase.from("tracker_tasks")
        .update(update)
        .eq("user_id", user.id)
        .eq("task_key", item.task_key);
    }));
    if (results.some(({ error }) => error)) {
      setTrackerTasks(originalTasks);
      setTaskMessage("Couldn't move that task. Nothing changed.");
      return;
    }
    setTaskMessage(sourceSection === targetSection ? "Task moved ✨" : \`Moved to \${targetSection} ✨\`);
  };

  const finishTouchTaskDrag = (event, sourceKey) => {
    if (!sourceKey) return;
    const hit = document.elementFromPoint(event.clientX, event.clientY);
    const taskTarget = hit?.closest?.("[data-plushlife-task-drop-key]");
    const groupTarget = hit?.closest?.("[data-plushlife-task-drop-section]");
    const targetKey = taskTarget?.getAttribute("data-plushlife-task-drop-key") || null;
    const targetSection = taskTarget?.getAttribute("data-plushlife-task-drop-section") || groupTarget?.getAttribute("data-plushlife-task-drop-section") || null;
    taskDragKeyRef.current = null;
    if (targetSection) moveTaskToSection(sourceKey, targetSection, targetKey);
  };

  const startEditingTask`;

src = src.replace(reorderPattern, movementBlock);

const managerPattern = /              return \(\n                <div style=\{\{ display: "grid", gap: 7, marginTop: 11 \}\}>\n                  \{\[\.\.\.visibleTasks\][\s\S]*?\n                <\/div>\n              \);/;
if (!managerPattern.test(src)) throw new Error('Could not locate task manager list renderer');

const managerBlock = `              const groupedTasks = [...visibleTasks]
                .sort((a, b) => (a.section || "").localeCompare(b.section || "") || Number(a.sort_order) - Number(b.sort_order))
                .reduce((groups, task) => {
                  const section = task.section || "My tasks";
                  if (!groups.has(section)) groups.set(section, []);
                  groups.get(section).push(task);
                  return groups;
                }, new Map());
              return (
                <div style={{ display: "grid", gap: 10, marginTop: 11 }}>
                  {!isSearching && <div style={{ padding: "8px 10px", borderRadius: 10, background: "#F8F2FB", border: "1px solid #E6D4F2", color: "#76558A", fontSize: 11.5, lineHeight: 1.45 }}>↕️ <strong>Press and drag the ⋮⋮ handle</strong> to move a task into another group or change its order. Changes save automatically.</div>}
                  {[...groupedTasks.entries()].map(([section, sectionTasks]) => (
                    <section
                      key={section}
                      data-plushlife-task-drop-section={section}
                      onDragOver={!isSearching ? (event) => { event.preventDefault(); event.dataTransfer.dropEffect = "move"; } : undefined}
                      onDrop={!isSearching ? (event) => {
                        event.preventDefault();
                        const sourceKey = event.dataTransfer.getData("text/plain");
                        moveTaskToSection(sourceKey, section);
                      } : undefined}
                      style={{ padding: 9, borderRadius: 14, background: "#FAF7FC", border: "1px solid #E6D4F2" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, margin: "0 2px 7px" }}>
                        <div style={{ fontSize: 11, fontWeight: 900, color: "#76558A", letterSpacing: ".06em", overflowWrap: "anywhere" }}>{section.toUpperCase()}</div>
                        <div style={{ fontSize: 10, color: "#9A86A7" }}>{sectionTasks.length} {sectionTasks.length === 1 ? "task" : "tasks"}</div>
                      </div>
                      <div style={{ display: "grid", gap: 7 }}>
                        {sectionTasks.map((task) => (
                          <div
                            key={task.task_key}
                            data-plushlife-task-drop-key={task.task_key}
                            data-plushlife-task-drop-section={section}
                            onDragOver={!isSearching ? (event) => { event.preventDefault(); event.stopPropagation(); event.dataTransfer.dropEffect = "move"; } : undefined}
                            onDrop={!isSearching ? (event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              const sourceKey = event.dataTransfer.getData("text/plain");
                              moveTaskToSection(sourceKey, section, task.task_key);
                            } : undefined}
                            style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "9px 10px", borderRadius: 11, background: "#FFFFFFD9", border: isTaskPausedOnDate(task, period.date) ? "1px solid #E9C96E" : "1px solid #DDEBE7" }}
                          >
                            {!isSearching && <button
                              type="button"
                              draggable="true"
                              aria-label={\`Drag \${task.task} to another group\`}
                              title="Drag to move"
                              onClick={(event) => event.preventDefault()}
                              onDragStart={(event) => {
                                taskDragKeyRef.current = task.task_key;
                                event.dataTransfer.effectAllowed = "move";
                                event.dataTransfer.setData("text/plain", task.task_key);
                              }}
                              onDragEnd={() => { taskDragKeyRef.current = null; }}
                              onPointerDown={(event) => {
                                if (event.pointerType !== "touch" && event.pointerType !== "pen") return;
                                taskDragKeyRef.current = task.task_key;
                                event.currentTarget.setPointerCapture?.(event.pointerId);
                              }}
                              onPointerUp={(event) => {
                                if (event.pointerType !== "touch" && event.pointerType !== "pen") return;
                                finishTouchTaskDrag(event, taskDragKeyRef.current || task.task_key);
                              }}
                              onPointerCancel={() => { taskDragKeyRef.current = null; }}
                              style={{ flex: "0 0 auto", width: 34, height: 34, padding: 0, borderRadius: 9, border: "1px solid #D6C3E6", background: "#FBF7FD", color: "#76558A", fontWeight: 900, fontSize: 16, lineHeight: 1, cursor: "grab", touchAction: "none" }}
                            >⋮⋮</button>}
                            <div style={{ flex: "1 1 160px", minWidth: 0 }}>
                              <div style={{ fontSize: 12.5, fontWeight: 900, color: "#5B4B6B", overflowWrap: "anywhere" }}><HabitTypeIcon task={task} />{task.task}{isTaskPausedOnDate(task, period.date) && <span style={{ marginLeft: 6, padding: "2px 7px", borderRadius: 999, background: "#FFFBF2", color: "#A56D14", fontSize: 10, fontWeight: 900 }}>⏸ PAUSED{task.paused_until ? \` UNTIL \${task.paused_until}\` : ""}</span>}</div>
                              <div style={{ marginTop: 2, fontSize: 10.5, color: "#8C6B9E" }}>{scheduleLabelForTask(task)} · {task.section || "My tasks"}</div>
                            </div>
                            {!isSearching && taskSectionsForDay(task.day_id).length > 1 && <select
                              defaultValue=""
                              aria-label={\`Move \${task.task} to another group\`}
                              onChange={(event) => {
                                const targetSection = event.target.value;
                                event.target.value = "";
                                if (targetSection) moveTaskToSection(task.task_key, targetSection);
                              }}
                              style={{ maxWidth: 120, padding: "6px 7px", borderRadius: 8, border: "1px solid #D6C3E6", background: "white", color: "#76558A", fontWeight: 800, fontSize: 10.5 }}
                            >
                              <option value="">Move to…</option>
                              {taskSectionsForDay(task.day_id).filter((name) => name !== task.section).map((name) => <option key={name} value={name}>{name}</option>)}
                            </select>}
                            <button type="button" onClick={() => startEditingTask(task)} aria-label={\`Edit \${task.task}\`} style={{ padding: "6px 9px", borderRadius: 8, border: "1px solid #B9DCF6", background: "#F7FBFF", color: "#4C8FE8", fontWeight: 900, cursor: "pointer" }}>✏️ Edit</button>
                            {isTaskPausedOnDate(task, period.date) ? (
                              <button type="button" onClick={() => resumeTrackerTask(task.task_key)} aria-label={\`Resume \${task.task}\`} style={{ padding: "6px 9px", borderRadius: 8, border: "1px solid #BFE5D2", background: "#F4FBF8", color: "#318C79", fontWeight: 900, cursor: "pointer" }}>▶️ Resume</button>
                            ) : (
                              <button type="button" onClick={() => pauseTrackerTask(task.task_key)} aria-label={\`Pause \${task.task}\`} style={{ padding: "6px 9px", borderRadius: 8, border: "1px solid #E7C98D", background: "#FFFBF2", color: "#9A6918", fontWeight: 900, cursor: "pointer" }}>⏸ Pause</button>
                            )}
                            <button type="button" onClick={() => archiveTrackerTask(task.task_key)} aria-label={\`Archive \${task.task}\`} style={{ padding: "6px 9px", borderRadius: 8, border: "1px solid #E7C98D", background: "#FFFBF2", color: "#9A6918", fontWeight: 900, cursor: "pointer" }}>📦 Archive</button>
                            <button type="button" onClick={() => setPendingTaskDelete({ key: task.task_key, label: task.task, section: task.section })} aria-label={\`Delete \${task.task}\`} style={{ padding: "6px 9px", borderRadius: 8, border: "1px solid #F0B8C4", background: "#FFF7F9", color: "#C45D74", fontWeight: 900, cursor: "pointer" }}>🗑️ Delete</button>
                          </div>
                        ))}
                      </div>
                    </section>
                  ))}
                </div>
              );`;

src = src.replace(managerPattern, managerBlock);
fs.writeFileSync(path, src);
console.log('Patched task group drag-and-drop into index.html');
