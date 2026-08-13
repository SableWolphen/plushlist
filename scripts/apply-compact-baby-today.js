const fs = require('fs');
function read(p){return fs.readFileSync(p,'utf8');}
function write(p,s){fs.writeFileSync(p,s);}
function rep(src, oldText, newText, label){if(!src.includes(oldText)) throw new Error('Missing '+label); return src.replace(oldText,newText);}

{
  const p='src/components/baby-today.jsx';
  let s=read(p);
  s=rep(s,
'  const visible = showAllLittleJobs ? waiting : waiting.slice(0, 4);',
'  const visible = showAllLittleJobs ? waiting : waiting.slice(0, 3);\n  const completedCount = allLittleJobs.filter((row) => !!viewDone[row.key] && !lingering.has(row.key)).length;',
'visible jobs');

  s=rep(s,
'    <div className="baby-today-simple" style={{ display: "grid", gap: 13, marginBottom: 18 }}>',
'    <div className="baby-today-simple" style={{ display: "grid", gap: 9, marginBottom: 14 }}>',
'root spacing');

  s=rep(s,
'      <section style={{ padding: 16, borderRadius: 20, background: "linear-gradient(145deg,#FFF8FD,#F4FBFF)", border: "1px solid #E3C9EC", boxShadow: "0 8px 24px rgba(118,85,138,.08)" }}>',
'      <section style={{ padding: 13, borderRadius: 17, background: "linear-gradient(145deg,#FFF8FD,#F4FBFF)", border: "1px solid #E3C9EC", boxShadow: "0 6px 18px rgba(118,85,138,.06)" }}>',
'tiny card');

  s=rep(s,
'            <div style={{ marginTop: 7, fontSize: 20, lineHeight: 1.28, fontWeight: 900, color: "#4F405C" }}>',
'            <div style={{ marginTop: 5, fontSize: 18, lineHeight: 1.25, fontWeight: 900, color: "#4F405C" }}>',
'tiny title');

  s=rep(s,
'            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 12 }}>',
'            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginTop: 9 }}>',
'tiny actions');

  s=rep(s,
'        <div style={{ display: "flex", gap: 7, marginTop: 10, flexWrap: "wrap" }}>\n          <button type="button" onClick={() => selectDayType?.("soft")} style={{ ...softButton, padding: "8px 10px", fontSize: 11.5 }}>🌼 Soft day</button>\n          <button type="button" onClick={() => selectDayType?.("tiny")} style={{ ...softButton, padding: "8px 10px", fontSize: 11.5 }}>🌱 Tiny day</button>\n          <button type="button" onClick={openCare} style={{ ...softButton, padding: "8px 10px", fontSize: 11.5 }}>♥ I need comfort</button>\n        </div>',
'        <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>\n          <button type="button" onClick={() => selectDayType?.("soft")} style={{ ...softButton, minHeight: 40, padding: "7px 9px", fontSize: 11 }}>🌼 Soft</button>\n          <button type="button" onClick={() => selectDayType?.("tiny")} style={{ ...softButton, minHeight: 40, padding: "7px 9px", fontSize: 11 }}>🌱 Tiny</button>\n          <button type="button" onClick={openCare} style={{ ...softButton, minHeight: 40, padding: "7px 9px", fontSize: 11 }}>♥ Comfort</button>\n        </div>',
'quick buttons');

  s=rep(s,
'      <section style={{ padding: 15, borderRadius: 18, background: "rgba(255,255,255,.82)", border: "1px solid #E6D4F2" }}>',
'      <section style={{ padding: 12, borderRadius: 16, background: "rgba(255,255,255,.82)", border: "1px solid #E6D4F2" }}>',
'little jobs card');

  s=rep(s,
'            <div style={{ marginTop: 3, fontSize: 11.5, color: "#8C6B9E" }}>Finished jobs cross off here first, then tuck into Completed Today.</div>',
'            <div style={{ marginTop: 2, fontSize: 10.8, color: "#8C6B9E" }}>{waiting.length} still waiting</div>',
'little jobs description');

  s=rep(s,
'        <CompletedTaskArea rows={allLittleJobs} viewDone={viewDone} lingerKeys={completedLingerKeys} toggle={toggle} title="Completed today" compact />',
'        {completedCount > 0 && <details style={{ marginTop: 8, borderRadius: 12, border: "1px solid #E7DDEB", background: "rgba(255,255,255,.58)", overflow: "hidden" }}>\n          <summary style={{ minHeight: 44, padding: "10px 11px", cursor: "pointer", color: "#806B8D", fontSize: 11.5, fontWeight: 900 }}>✓ {completedCount} tucked in today</summary>\n          <div style={{ padding: "0 6px 6px" }}><CompletedTaskArea rows={allLittleJobs} viewDone={viewDone} lingerKeys={completedLingerKeys} toggle={toggle} title="Completed today" compact /></div>\n        </details>}',
'completed collapse');

  s=rep(s,
'          {waiting.length > 4 && <button type="button" aria-expanded={showAllLittleJobs} onClick={() => setShowAllLittleJobs((expanded) => !expanded)} style={softButton}>{showAllLittleJobs ? "Show fewer little jobs" : `Show all ${waiting.length} little jobs`}</button>}\n          <button type="button" onClick={() => openTaskManager?.()} style={softButton}>✏️ Change my little jobs</button>',
'          {waiting.length > 3 && <button type="button" aria-expanded={showAllLittleJobs} onClick={() => setShowAllLittleJobs((expanded) => !expanded)} style={{ ...softButton, minHeight: 40, padding: "7px 10px", fontSize: 11.5 }}>{showAllLittleJobs ? "Show fewer" : `Show all ${waiting.length}`}</button>}\n          <button type="button" onClick={() => openTaskManager?.()} style={{ ...softButton, minHeight: 40, padding: "7px 10px", fontSize: 11.5 }}>✏️ Edit jobs</button>',
'jobs footer');

  write(p,s);
}

{
  const p='src/components/baby-mode.jsx';
  let s=read(p);
  const old='export function BabyArrivalRitual({ comfortItemName, onShowTinyThing, onSoftDay, onShowPlanner }) {\n  return (\n    <section className="baby-arrival-ritual" aria-label="Little space arrival">\n      <div><div className="baby-arrival-kicker">🍼 LITTLE SPACE ARRIVAL</div><div className="baby-arrival-title">Hi baby. You are safe here.</div><div className="baby-arrival-copy">We only need one small thing at a time.{comfortItemName ? ` Is ${comfortItemName} nearby?` : ""}</div></div>\n      <div className="baby-arrival-actions">\n        <button type="button" onClick={onShowTinyThing}>🧸 Show my tiny thing</button>\n        <button type="button" onClick={onSoftDay}>🌼 Make today soft</button>\n        <button type="button" onClick={onShowPlanner}>🗓 Show my planner</button>\n      </div>\n    </section>\n  );\n}';
  const neu='export function BabyArrivalRitual({ comfortItemName, onShowTinyThing, onSoftDay, onShowPlanner }) {\n  return (\n    <section className="baby-arrival-ritual baby-arrival-ritual-compact" aria-label="Little space arrival">\n      <div><div className="baby-arrival-kicker">🍼 LITTLE SPACE</div><div className="baby-arrival-title">Hi baby. One tiny thing at a time.{comfortItemName ? ` ${comfortItemName} can stay close.` : ""}</div></div>\n      <div className="baby-arrival-actions">\n        <button type="button" onClick={onShowTinyThing}>🧸 Tiny thing</button>\n        <button type="button" onClick={onSoftDay}>🌼 Soft day</button>\n      </div>\n    </section>\n  );\n}';
  s=rep(s,old,neu,'arrival ritual');
  write(p,s);
}

{
  const p='scripts/test-product-quality.js';
  let s=read(p);
  s=rep(s,
'  [baby.includes("CompletedTaskArea") && baby.includes("recentlyCompletedKeys"), "Baby Mode uses the same completion lifecycle"],',
'  [baby.includes("CompletedTaskArea") && baby.includes("recentlyCompletedKeys"), "Baby Mode uses the same completion lifecycle"],\n  [baby.includes("✓ {completedCount} tucked in today") && baby.includes("waiting.slice(0, 3)"), "Baby Mode keeps completed work collapsed and limits the first job list"],',
'baby compact regression');
  write(p,s);
}
