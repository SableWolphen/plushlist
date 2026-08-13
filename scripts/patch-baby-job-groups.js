const fs = require('fs');

function replaceOnce(path, from, to, label) {
  const source = fs.readFileSync(path, 'utf8');
  if (!source.includes(from)) throw new Error(`Missing ${label} in ${path}`);
  fs.writeFileSync(path, source.replace(from, to));
}

const path = 'src/components/baby-today.jsx';

replaceOnce(path,
`  openTaskManager,
  openJournalForSelectedDate,`,
`  openTaskManager,
  moveTaskGroup,
  startPointerTaskDrag,
  movePointerTaskDrag,
  endPointerTaskDrag,
  cancelPointerTaskDrag,
  openJournalForSelectedDate,`,
'BabyToday reorder props');

replaceOnce(path,
`  const visible = showAllLittleJobs ? waiting : waiting.slice(0, 3);
  const completedCount = allLittleJobs.filter((row) => !!viewDone[row.key] && !lingering.has(row.key)).length;`,
`  const visible = showAllLittleJobs ? waiting : waiting.slice(0, 3);
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
  const completedCount = allLittleJobs.filter((row) => !!viewDone[row.key] && !lingering.has(row.key)).length;`,
'visible Baby Mode job groups');

replaceOnce(path,
`  const littleJobStyle = (done) => ({
    minHeight: 48,
    display: "grid",
    gridTemplateColumns: "24px 1fr",`,
`  const littleJobStyle = (done) => ({
    minHeight: 48,
    display: "grid",
    gridTemplateColumns: "24px minmax(0,1fr) 36px",`,
'Baby Mode drag handle column');

const oldBlock = `        <div style={{ display: "grid", gap: 7, marginTop: 10 }}>
          {visible.map((task) => {
            const doneNow = !!viewDone[task.key];
            return <button key={task.key} type="button" onClick={() => toggle(task.key)} aria-label={doneNow ? \`Mark \${task.label} incomplete\` : \`Mark \${task.label} complete\`} style={littleJobStyle(doneNow)}>
              <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: "50%", border: doneNow ? 0 : "2px solid #B67AC8", background: doneNow ? "#B67AC8" : "transparent", color: "white", display: "grid", placeItems: "center", fontWeight: 900 }}>{doneNow ? "✓" : "○"}</span>
              <span style={{ fontSize: 13, lineHeight: 1.35, fontWeight: 850, textDecoration: doneNow ? "line-through" : "none" }}>{task.label}</span>
            </button>;
          })}
          {!visible.length && <div style={{ padding: "12px 2px", color: "#806B8D", fontSize: 12.5 }}>All tucked in. 💜</div>}
        </div>`;

const newBlock = `        <div style={{ display: "grid", gap: 7, marginTop: 10 }}>
          {visibleGroups.map((group) => {
            const groupIndex = visibleGroupOrder.indexOf(group.section);
            return <div key={group.key} style={{ display: "grid", gap: 7 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "2px 2px 0" }}>
                <span style={{ fontSize: 10.5, letterSpacing: ".12em", color: "#A65DC1", fontWeight: 900 }}>{group.label.toUpperCase()}</span>
                {showAllLittleJobs && group.section && visibleGroupOrder.length > 1 && <span style={{ display: "flex", gap: 4 }}>
                  <button type="button" disabled={groupIndex <= 0} onClick={() => moveTaskGroup?.(group.section, -1, visibleGroupOrder)} aria-label={\`Move \${group.label} group earlier\`} title="Move group earlier" style={{ width: 36, minWidth: 36, height: 36, padding: 0, borderRadius: 9, border: "1px solid #E7D2E8", background: "white", color: "#A65DC1", opacity: groupIndex <= 0 ? .35 : 1, fontWeight: 900, cursor: groupIndex <= 0 ? "default" : "pointer" }}>↑</button>
                  <button type="button" disabled={groupIndex < 0 || groupIndex === visibleGroupOrder.length - 1} onClick={() => moveTaskGroup?.(group.section, 1, visibleGroupOrder)} aria-label={\`Move \${group.label} group later\`} title="Move group later" style={{ width: 36, minWidth: 36, height: 36, padding: 0, borderRadius: 9, border: "1px solid #E7D2E8", background: "white", color: "#A65DC1", opacity: groupIndex < 0 || groupIndex === visibleGroupOrder.length - 1 ? .35 : 1, fontWeight: 900, cursor: groupIndex < 0 || groupIndex === visibleGroupOrder.length - 1 ? "default" : "pointer" }}>↓</button>
                </span>}
              </div>
              {group.tasks.map((task) => {
                const doneNow = !!viewDone[task.key];
                return <div key={task.key} style={littleJobStyle(doneNow)}>
                  <button type="button" onClick={() => toggle(task.key)} aria-label={doneNow ? \`Mark \${task.label} incomplete\` : \`Mark \${task.label} complete\`} style={{ width: 24, height: 24, padding: 0, border: 0, background: "transparent", cursor: "pointer" }}>
                    <span aria-hidden="true" style={{ width: 22, height: 22, borderRadius: "50%", border: doneNow ? 0 : "2px solid #B67AC8", background: doneNow ? "#B67AC8" : "transparent", color: "white", display: "grid", placeItems: "center", fontWeight: 900 }}>{doneNow ? "✓" : "○"}</span>
                  </button>
                  <button type="button" onClick={() => toggle(task.key)} style={{ minWidth: 0, padding: 0, border: 0, background: "transparent", color: "inherit", textAlign: "left", cursor: "pointer" }}>
                    <span style={{ fontSize: 13, lineHeight: 1.35, fontWeight: 850, textDecoration: doneNow ? "line-through" : "none" }}>{task.label}</span>
                  </button>
                  {task.sourceTask?.task_key && <button type="button" draggable={false} aria-label={\`Reorder \${task.label}\`} title="Hold and drag to move" onClick={(event) => { event.preventDefault(); event.stopPropagation(); }} onPointerDown={(event) => startPointerTaskDrag?.(event, task.sourceTask.task_key, task.label)} onPointerMove={movePointerTaskDrag} onPointerUp={endPointerTaskDrag} onPointerCancel={cancelPointerTaskDrag} onContextMenu={(event) => event.preventDefault()} style={{ width: 36, minWidth: 36, height: 36, padding: 0, borderRadius: 9, border: "1px solid #E7D2E8", background: "#FFF9FD", color: "#A65DC1", fontWeight: 900, fontSize: 17, lineHeight: 1, cursor: "grab", touchAction: "none" }}>⋮⋮</button>}
                </div>;
              })}
            </div>;
          })}
          {!visible.length && <div style={{ padding: "12px 2px", color: "#806B8D", fontSize: 12.5 }}>All tucked in. 💜</div>}
        </div>`;
replaceOnce(path, oldBlock, newBlock, 'Baby Mode Little Jobs renderer');

const audit = 'scripts/audit-interactive-wiring.js';
replaceOnce(audit,
`    ['entry.text || entry.label || entry.title', 'Baby Mode schedule uses saved item text'],`,
`    ['entry.text || entry.label || entry.title', 'Baby Mode schedule uses saved item text'],
    ['visibleGroups.map((group)', 'Baby Mode grouped Little Jobs'],
    ['moveTaskGroup?.(group.section', 'Baby Mode group reorder controls'],
    ['startPointerTaskDrag?.(event, task.sourceTask.task_key', 'Baby Mode task drag reorder'],`,
'Baby Mode reorder audit');

console.log('Baby Mode grouped Little Jobs/reorder patch applied.');
