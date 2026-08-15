// The "Change my schedule" ToolPanel — module split phase 7, third
// slice (see docs/module-split-plan.md). Moderate size, no local
// derived-state complications like the previous slice's viewers —
// pure prop drilling of GlowUpTracker's existing schedule-editing
// state and handlers.
import { ToolPanel } from "./shared.jsx";

export function ScheduleEditorPanel({ open, onClose, scheduleEditingDayId, setScheduleEditDayId, personalSchedules, scheduleDraft, updateScheduleEntry, removeScheduleEntry, addScheduleEntry, savePersonalSchedule, copyScheduleToAllDays, clearPersonalSchedule, copyToDayIds, toggleCopyToDay, copyScheduleToSelectedDays, scheduleMessage, scheduleExceptionDraft, setScheduleExceptionDraft, updateScheduleExceptionEntry, removeScheduleExceptionEntry, addScheduleExceptionEntry, saveScheduleException, scheduleExceptionMessage, scheduleExceptions, deleteScheduleException }) {
  if (!open) return null;
  const { DAYS } = window.PlushLifeContent;
  const confirmCopyToAllDays = () => {
    if (!window.confirm("Copy this schedule to all 7 days? This can overwrite schedules on other days.")) return;
    copyScheduleToAllDays();
  };
  return (
          <ToolPanel title="Change my schedule" onClose={onClose}>
          <div style={{ marginBottom: 12, padding: 13, borderRadius: 16, background: "linear-gradient(145deg,#F3FAFF,#FFF9FD)", border: "2px solid #B9DCF6", boxShadow: "0 8px 22px rgba(76,143,232,.09)" }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#4C8FE8" }}>WHICH DAY DO I WANT TO CHANGE?</div>
            <div style={{ marginTop: 4, fontSize: 11, lineHeight: 1.4, color: "#5F718B" }}>Every day can have its own schedule. Switch days here — no need to leave this panel.</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 6, marginTop: 8 }}>
              {DAYS.map((item) => {
                const selected = scheduleEditingDayId === item.id;
                const hasSchedule = personalSchedules.some((entry) => entry.day_id === item.id);
                return (
                  <button key={item.id} type="button" aria-pressed={selected} onClick={() => setScheduleEditDayId(item.id)} style={{ minWidth: 0, minHeight: 0, padding: "5px 4px", borderRadius: 9, border: selected ? "2px solid #4C8FE8" : "1px solid #B9DCF6", background: selected ? "#DDEEFF" : "#FFFFFFCC", color: selected ? "#2D6BB5" : "#5F718B", fontWeight: 900, fontSize: 10.5, lineHeight: 1.15, cursor: "pointer" }}>
                    {item.label}{hasSchedule ? " ✓" : ""}
                  </button>
                );
              })}
            </div>
          </div>
          <div style={{ marginBottom: 16, padding: 13, borderRadius: 15, background: "rgba(255,255,255,0.72)", border: "1px solid #CFE4F5" }}>
            <div style={{ fontSize: 11.5, fontWeight: 900, color: "#4C8FE8" }}>{DAYS.find((item) => item.id === scheduleEditingDayId)?.label || scheduleEditingDayId.toUpperCase()}'S SCHEDULE</div>
            <div style={{ marginTop: 5, padding: "7px 9px", borderRadius: 9, background: "#F4FAFF", color: "#5F718B", fontSize: 11, lineHeight: 1.4 }}>
              Build this day from scratch — add whatever items you want, in your own words. Pick a time if it helps, or leave it blank.
            </div>
            <div style={{ display: "grid", gap: 7, marginTop: 9 }}>
              {scheduleDraft.entries.length === 0 && (
                <div style={{ padding: 9, borderRadius: 9, background: "#F4FAFF", color: "#6B7F8F", fontSize: 11.5 }}>Nothing added yet. Tap "＋ Add an item" below to start.</div>
              )}
              {scheduleDraft.entries.map((entry) => (
                <div key={entry.id} style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                  <input type="time" value={entry.time} onChange={(event) => updateScheduleEntry(entry.id, { time: event.target.value })} aria-label="Item time" style={{ padding: 7, borderRadius: 9, border: "1px solid #CFE4F5" }} />
                  <input value={entry.text} onChange={(event) => updateScheduleEntry(entry.id, { text: event.target.value })} maxLength={300} placeholder="Type what you want here…" aria-label="Item description" style={{ flex: "1 1 150px", minWidth: 0, padding: 7, borderRadius: 9, border: "1px solid #CFE4F5" }} />
                  <button type="button" onClick={() => removeScheduleEntry(entry.id)} aria-label="Remove this item" style={{ minHeight: 0, padding: "5px 7px", borderRadius: 7, border: "1px solid #F0B8C4", background: "#FFF7F9", color: "#C45D74", fontWeight: 900, cursor: "pointer", fontSize: 10.5, lineHeight: 1.1 }}>✕</button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addScheduleEntry} style={{ marginTop: 9, minHeight: 0, padding: "6px 9px", borderRadius: 8, border: "1px dashed #4C8FE888", background: "white", color: "#4C8FE8", fontWeight: 800, fontSize: 11, lineHeight: 1.2, cursor: "pointer" }}>＋ Add an item</button>
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap", alignItems: "center" }}>
              <button onClick={savePersonalSchedule} style={{ minHeight: 0, padding: "6px 10px", borderRadius: 8, border: 0, background: "#4C8FE8", color: "white", fontWeight: 900, fontSize: 11.5, lineHeight: 1.2, cursor: "pointer" }}>Save this day ✨</button>
              {personalSchedules.some((entry) => entry.day_id === scheduleEditingDayId) && <button onClick={clearPersonalSchedule} style={{ minHeight: 0, padding: "5px 9px", borderRadius: 8, border: "1px solid #F0B8C4", background: "#FFF7F9", color: "#C45D74", fontWeight: 800, fontSize: 10.5, lineHeight: 1.2, cursor: "pointer" }}>Erase this day's schedule</button>}
            </div>
            <div style={{ marginTop: 10, paddingTop: 9, borderTop: "1px solid #E4E9F5" }}>
              <div style={{ fontSize: 10, fontWeight: 900, color: "#4C8FE8", letterSpacing: "0.06em" }}>OR COPY TO JUST A FEW DAYS</div>
              <div style={{ marginTop: 3, fontSize: 10.75, color: "#6B7C99" }}>Example: pick MON + FRI if those two should match this one.</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,minmax(0,1fr))", gap: 5, marginTop: 7 }}>
                {DAYS.filter((item) => item.id !== scheduleEditingDayId).map((item) => {
                  const selected = copyToDayIds.includes(item.id);
                  return (
                    <button key={item.id} type="button" aria-pressed={selected} onClick={() => toggleCopyToDay(item.id)} style={{ minHeight: 0, padding: "5px 4px", borderRadius: 8, border: selected ? "2px solid #4C8FE8" : "1px solid #D6DEEE", background: selected ? "#DDEEFF" : "white", color: selected ? "#2D6BB5" : "#6B7C99", fontWeight: 800, fontSize: 10.5, lineHeight: 1.15, cursor: "pointer" }}>
                      {item.label}
                    </button>
                  );
                })}
              </div>
              <button type="button" onClick={copyScheduleToSelectedDays} disabled={copyToDayIds.length === 0} style={{ marginTop: 8, minHeight: 0, padding: "5px 9px", borderRadius: 8, border: "1px solid #4C8FE855", background: copyToDayIds.length === 0 ? "#F4F7FC" : "#EAF4FF", color: copyToDayIds.length === 0 ? "#A7B4CC" : "#2D6BB5", fontWeight: 800, fontSize: 10.75, lineHeight: 1.2, cursor: copyToDayIds.length === 0 ? "not-allowed" : "pointer" }}>
                📋 Copy to {copyToDayIds.length === 0 ? "selected days" : copyToDayIds.map((id) => DAYS.find((d) => d.id === id)?.label).join(", ")}
              </button>
              <div style={{ marginTop: 9, paddingTop: 7, borderTop: "1px solid #EEF1F7" }}>
                <button type="button" onClick={confirmCopyToAllDays} style={{ minHeight: 0, padding: "3px 2px", borderRadius: 0, border: 0, background: "transparent", color: "#4F7FBE", fontWeight: 800, fontSize: 10.25, lineHeight: 1.2, textDecoration: "underline", textUnderlineOffset: 2, cursor: "pointer" }}>
                  Copy this day to all 7 days…
                </button>
              </div>
            </div>
            {scheduleMessage && <div style={{ marginTop: 7, fontSize: 11.5, color: "#8C6B9E" }}>{scheduleMessage}</div>}
          </div>
          <div style={{ marginBottom: 16, padding: 13, borderRadius: 15, background: "#F3FBF7", border: "1px solid #B9E0D0" }}>
            <div style={{ fontSize: 11.5, fontWeight: 900, color: "#318C79" }}>✨ TEMPORARY SCHEDULE EXTRAS</div>
            <div style={{ marginTop: 4, fontSize: 11, lineHeight: 1.4, color: "#52746E" }}>Add extra items for one day or a date range. Your usual weekly schedule stays exactly as it is.</div>
            <div style={{ display: "flex", gap: 7, marginTop: 9, flexWrap: "wrap" }}>
              <label style={{ fontSize: 10.75, fontWeight: 800, color: "#52746E" }}>Starts<input type="date" value={scheduleExceptionDraft.start_date} onChange={(event) => setScheduleExceptionDraft((draft) => ({ ...draft, start_date: event.target.value, end_date: draft.end_date && draft.end_date < event.target.value ? event.target.value : draft.end_date }))} style={{ display: "block", marginTop: 4, padding: 7, borderRadius: 8, border: "1px solid #B9E0D0" }} /></label>
              <label style={{ fontSize: 10.75, fontWeight: 800, color: "#52746E" }}>Ends<input type="date" value={scheduleExceptionDraft.end_date} min={scheduleExceptionDraft.start_date} onChange={(event) => setScheduleExceptionDraft((draft) => ({ ...draft, end_date: event.target.value }))} style={{ display: "block", marginTop: 4, padding: 7, borderRadius: 8, border: "1px solid #B9E0D0" }} /></label>
            </div>
            <div style={{ display: "grid", gap: 7, marginTop: 9 }}>
              {scheduleExceptionDraft.entries.map((entry) => <div key={entry.id} style={{ display: "flex", gap: 7, flexWrap: "wrap", alignItems: "center" }}><input type="time" value={entry.time} onChange={(event) => updateScheduleExceptionEntry(entry.id, { time: event.target.value })} aria-label="Extra item time" style={{ padding: 7, borderRadius: 8, border: "1px solid #B9E0D0" }} /><input value={entry.text} onChange={(event) => updateScheduleExceptionEntry(entry.id, { text: event.target.value })} maxLength={300} placeholder="Extra plan for these dates…" aria-label="Extra item description" style={{ flex: "1 1 150px", minWidth: 0, padding: 7, borderRadius: 8, border: "1px solid #B9E0D0" }} /><button type="button" onClick={() => removeScheduleExceptionEntry(entry.id)} aria-label="Remove this extra item" style={{ minHeight: 0, padding: "5px 7px", borderRadius: 7, border: "1px solid #F0B8C4", background: "white", color: "#C45D74", fontWeight: 900, fontSize: 10.5, lineHeight: 1.1, cursor: "pointer" }}>✕</button></div>)}
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 9, flexWrap: "wrap", alignItems: "center" }}><button type="button" onClick={addScheduleExceptionEntry} style={{ minHeight: 0, padding: "6px 9px", borderRadius: 8, border: "1px dashed #318C79", background: "white", color: "#318C79", fontWeight: 800, fontSize: 11, lineHeight: 1.2, cursor: "pointer" }}>＋ Add an extra item</button><button type="button" onClick={saveScheduleException} style={{ minHeight: 0, padding: "6px 9px", borderRadius: 8, border: 0, background: "#318C79", color: "white", fontWeight: 900, fontSize: 11, lineHeight: 1.2, cursor: "pointer" }}>Save temporary extras</button></div>
            {scheduleExceptionMessage && <div role="status" style={{ marginTop: 7, fontSize: 11.25, color: "#52746E", fontWeight: 700 }}>{scheduleExceptionMessage}</div>}
            {scheduleExceptions.length > 0 && <div style={{ marginTop: 10, paddingTop: 9, borderTop: "1px solid #CFE8E1" }}><div style={{ fontSize: 10, fontWeight: 900, color: "#318C79" }}>SAVED TEMPORARY EXTRAS</div>{scheduleExceptions.map((item) => <div key={item.id} style={{ display: "flex", justifyContent: "space-between", gap: 7, alignItems: "center", marginTop: 6, padding: "7px 8px", borderRadius: 8, background: "white", fontSize: 11, color: "#52746E" }}><span>{item.start_date === item.end_date ? item.start_date : `${item.start_date} – ${item.end_date}`} · {(item.entries || []).map((entry) => entry.text).filter(Boolean).join(" · ")}</span><button type="button" onClick={() => deleteScheduleException(item.id)} style={{ minHeight: 0, padding: "3px 4px", border: 0, background: "transparent", color: "#C45D74", fontWeight: 900, fontSize: 10.5, lineHeight: 1.1, cursor: "pointer" }}>Remove</button></div>)}</div>}
          </div>
          </ToolPanel>
  );
}
