// The "Change my schedule" ToolPanel — module split phase 7, third
// slice (see docs/module-split-plan.md). Moderate size, no local
// derived-state complications like the previous slice's viewers —
// pure prop drilling of GlowUpTracker's existing schedule-editing
// state and handlers.
import { ToolPanel } from "./shared.jsx";

export function ScheduleEditorPanel({ open, onClose, scheduleEditingDayId, setScheduleEditDayId, personalSchedules, scheduleDraft, updateScheduleEntry, removeScheduleEntry, addScheduleEntry, savePersonalSchedule, copyScheduleToAllDays, clearPersonalSchedule, copyToDayIds, toggleCopyToDay, copyScheduleToSelectedDays, scheduleMessage, scheduleExceptionDraft, setScheduleExceptionDraft, updateScheduleExceptionEntry, removeScheduleExceptionEntry, addScheduleExceptionEntry, saveScheduleException, scheduleExceptionMessage, scheduleExceptions, deleteScheduleException }) {
  if (!open) return null;
  const { DAYS } = window.PlushLifeContent;
  const currentDay = DAYS.find((item) => item.id === scheduleEditingDayId);
  const hasCurrentSchedule = personalSchedules.some((entry) => entry.day_id === scheduleEditingDayId);

  const confirmCopyToAllDays = () => {
    if (!window.confirm("Copy this schedule to all 7 days? This can overwrite schedules on other days.")) return;
    copyScheduleToAllDays();
  };

  return (
    <ToolPanel title="Change my schedule" onClose={onClose}>
      <div className="schedule-panel">
        <style>{`
          .schedule-panel{--blue:#4C8FE8;--blue-dark:#2D6BB5;--ink:#53657B;--line:#D9E6F2;--rose:#C45D74;--green:#318C79;display:grid;gap:12px;padding-bottom:4px}
          .schedule-panel *{box-sizing:border-box}
          .schedule-panel button{min-height:0!important;line-height:1.15!important;box-shadow:none!important}
          .schedule-card{border:1px solid var(--line);border-radius:18px;background:rgba(255,255,255,.82);padding:13px}
          .schedule-card.day-picker{background:linear-gradient(145deg,#F7FBFF,#FFF9FD);border-color:#B9DCF6}
          .schedule-eyebrow{font-size:10.5px;font-weight:900;letter-spacing:.055em;color:var(--blue);text-transform:uppercase}
          .schedule-helper{margin-top:3px;font-size:10.75px;line-height:1.38;color:#6B7C91}
          .schedule-day-grid{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:5px;margin-top:9px}
          .schedule-day{padding:6px 2px!important;border-radius:9px!important;border:1px solid #CFE1EF!important;background:#fff!important;color:#61738A!important;font-size:10px!important;font-weight:900!important;cursor:pointer}
          .schedule-day.selected{border:2px solid var(--blue)!important;background:#E7F2FF!important;color:var(--blue-dark)!important;padding:5px 1px!important}
          .schedule-day .check{font-size:9px;opacity:.65}
          .schedule-intro{margin-top:6px;padding:7px 9px;border-radius:10px;background:#F5FAFE;color:#677A90;font-size:10.75px;line-height:1.38}
          .schedule-entry-list{display:grid;gap:7px;margin-top:9px}
          .schedule-entry{display:grid;grid-template-columns:108px minmax(0,1fr) 32px;gap:6px;align-items:center}
          .schedule-panel input[type="time"],.schedule-panel input[type="date"],.schedule-panel input:not([type]){min-width:0;width:100%;height:38px;padding:7px 9px;border:1px solid #D5E3EE;border-radius:10px;background:#fff;font-size:13px}
          .schedule-remove{width:32px;height:32px!important;padding:0!important;border-radius:9px!important;border:1px solid #EFC5CF!important;background:#FFF8FA!important;color:var(--rose)!important;font-size:14px!important;font-weight:900!important;cursor:pointer}
          .schedule-toolbar{display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-top:9px}
          .schedule-btn{padding:7px 10px!important;border-radius:10px!important;font-size:10.75px!important;font-weight:900!important;cursor:pointer}
          .schedule-btn.primary{border:0!important;background:var(--blue)!important;color:#fff!important}
          .schedule-btn.add{border:1px dashed #8FB8E8!important;background:#fff!important;color:var(--blue-dark)!important}
          .schedule-btn.danger{border:1px solid #EFC5CF!important;background:#FFF8FA!important;color:var(--rose)!important}
          .schedule-copy{margin-top:11px;padding-top:10px;border-top:1px solid #E8EEF5}
          .schedule-copy-title{display:flex;align-items:center;justify-content:space-between;gap:8px}
          .schedule-copy-days{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:5px;margin-top:8px}
          .schedule-copy-day{padding:6px 2px!important;border-radius:8px!important;border:1px solid #D6E0EC!important;background:#fff!important;color:#6B7C99!important;font-size:9.75px!important;font-weight:900!important;cursor:pointer}
          .schedule-copy-day.selected{border:2px solid var(--blue)!important;background:#E7F2FF!important;color:var(--blue-dark)!important;padding:5px 1px!important}
          .schedule-copy-actions{display:flex;align-items:center;gap:9px;flex-wrap:wrap;margin-top:8px}
          .schedule-copy-selected{padding:7px 10px!important;border-radius:9px!important;border:1px solid #BFD5EF!important;background:#EEF6FF!important;color:var(--blue-dark)!important;font-size:10.5px!important;font-weight:900!important;cursor:pointer}
          .schedule-copy-selected:disabled{opacity:.48;cursor:not-allowed}
          .schedule-copy-all{padding:4px 1px!important;border:0!important;background:transparent!important;color:#6E84A0!important;font-size:9.75px!important;font-weight:800!important;text-decoration:underline;text-underline-offset:2px;cursor:pointer}
          .schedule-status{margin-top:7px;font-size:10.75px;color:#8C6B9E;font-weight:700}
          .schedule-extras{background:linear-gradient(145deg,#F3FBF7,#F8FCFA);border-color:#B9E0D0}
          .schedule-extras .schedule-eyebrow{color:var(--green)}
          .schedule-date-row{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px}
          .schedule-date-label{font-size:10.25px;font-weight:900;color:#52746E}
          .schedule-date-label input{display:block;margin-top:4px;border-color:#B9E0D0!important}
          .schedule-extra-entry{display:grid;grid-template-columns:108px minmax(0,1fr) 32px;gap:6px;align-items:center}
          .schedule-btn.green{border:0!important;background:var(--green)!important;color:#fff!important}
          .schedule-btn.green-outline{border:1px dashed #58A997!important;background:#fff!important;color:var(--green)!important}
          .schedule-saved{margin-top:10px;padding-top:9px;border-top:1px solid #D2E9E2}
          .schedule-saved-row{display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-top:6px;padding:7px 8px;border-radius:9px;background:#fff;color:#52746E;font-size:10.5px;line-height:1.35}
          .schedule-remove-link{padding:2px!important;border:0!important;background:transparent!important;color:var(--rose)!important;font-size:9.75px!important;font-weight:900!important;cursor:pointer;white-space:nowrap}
          @media(max-width:520px){
            .schedule-panel{gap:10px}
            .schedule-card{padding:11px;border-radius:16px}
            .schedule-day-grid{grid-template-columns:repeat(4,minmax(0,1fr))}
            .schedule-copy-days{grid-template-columns:repeat(3,minmax(0,1fr))}
            .schedule-entry,.schedule-extra-entry{grid-template-columns:94px minmax(0,1fr) 30px;gap:5px}
            .schedule-panel input[type="time"],.schedule-panel input[type="date"],.schedule-panel input:not([type]){height:36px;padding:6px 8px;font-size:12px}
            .schedule-remove{width:30px;height:30px!important}
            .schedule-toolbar{gap:6px}
            .schedule-btn{padding:6px 9px!important;font-size:10.25px!important}
          }
        `}</style>

        <section className="schedule-card day-picker">
          <div className="schedule-eyebrow">Choose a day</div>
          <div className="schedule-helper">Switch days here. A check means that day already has a saved schedule.</div>
          <div className="schedule-day-grid">
            {DAYS.map((item) => {
              const selected = scheduleEditingDayId === item.id;
              const hasSchedule = personalSchedules.some((entry) => entry.day_id === item.id);
              return (
                <button key={item.id} type="button" aria-pressed={selected} onClick={() => setScheduleEditDayId(item.id)} className={`schedule-day${selected ? " selected" : ""}`}>
                  {item.label}{hasSchedule ? <span className="check"> ✓</span> : null}
                </button>
              );
            })}
          </div>
        </section>

        <section className="schedule-card">
          <div className="schedule-eyebrow">{currentDay?.label || scheduleEditingDayId.toUpperCase()} schedule</div>
          <div className="schedule-intro">Add only what matters for this day. Times are optional.</div>

          <div className="schedule-entry-list">
            {scheduleDraft.entries.length === 0 && (
              <div className="schedule-intro">Nothing added yet. Add your first item below.</div>
            )}
            {scheduleDraft.entries.map((entry) => (
              <div key={entry.id} className="schedule-entry">
                <input type="time" value={entry.time} onChange={(event) => updateScheduleEntry(entry.id, { time: event.target.value })} aria-label="Item time" />
                <input value={entry.text} onChange={(event) => updateScheduleEntry(entry.id, { text: event.target.value })} maxLength={300} placeholder="What happens here?" aria-label="Item description" />
                <button type="button" onClick={() => removeScheduleEntry(entry.id)} aria-label="Remove this item" className="schedule-remove">×</button>
              </div>
            ))}
          </div>

          <div className="schedule-toolbar">
            <button type="button" onClick={addScheduleEntry} className="schedule-btn add">＋ Add item</button>
            <button onClick={savePersonalSchedule} className="schedule-btn primary">Save day ✨</button>
            {hasCurrentSchedule && <button onClick={clearPersonalSchedule} className="schedule-btn danger">Erase day</button>}
          </div>

          <div className="schedule-copy">
            <div className="schedule-copy-title">
              <div>
                <div className="schedule-eyebrow">Copy this schedule</div>
                <div className="schedule-helper">Pick only the days that should match.</div>
              </div>
            </div>
            <div className="schedule-copy-days">
              {DAYS.filter((item) => item.id !== scheduleEditingDayId).map((item) => {
                const selected = copyToDayIds.includes(item.id);
                return (
                  <button key={item.id} type="button" aria-pressed={selected} onClick={() => toggleCopyToDay(item.id)} className={`schedule-copy-day${selected ? " selected" : ""}`}>
                    {item.label}
                  </button>
                );
              })}
            </div>
            <div className="schedule-copy-actions">
              <button type="button" onClick={copyScheduleToSelectedDays} disabled={copyToDayIds.length === 0} className="schedule-copy-selected">
                {copyToDayIds.length === 0 ? "Copy to selected" : `Copy to ${copyToDayIds.map((id) => DAYS.find((d) => d.id === id)?.label).join(", ")}`}
              </button>
              <button type="button" onClick={confirmCopyToAllDays} className="schedule-copy-all">Copy to all 7 instead…</button>
            </div>
          </div>

          {scheduleMessage && <div className="schedule-status">{scheduleMessage}</div>}
        </section>

        <section className="schedule-card schedule-extras">
          <div className="schedule-eyebrow">✨ Temporary extras</div>
          <div className="schedule-helper">Add one-off plans without changing your normal weekly schedule.</div>

          <div className="schedule-date-row">
            <label className="schedule-date-label">Starts
              <input type="date" value={scheduleExceptionDraft.start_date} onChange={(event) => setScheduleExceptionDraft((draft) => ({ ...draft, start_date: event.target.value, end_date: draft.end_date && draft.end_date < event.target.value ? event.target.value : draft.end_date }))} />
            </label>
            <label className="schedule-date-label">Ends
              <input type="date" value={scheduleExceptionDraft.end_date} min={scheduleExceptionDraft.start_date} onChange={(event) => setScheduleExceptionDraft((draft) => ({ ...draft, end_date: event.target.value }))} />
            </label>
          </div>

          <div className="schedule-entry-list">
            {scheduleExceptionDraft.entries.map((entry) => (
              <div key={entry.id} className="schedule-extra-entry">
                <input type="time" value={entry.time} onChange={(event) => updateScheduleExceptionEntry(entry.id, { time: event.target.value })} aria-label="Extra item time" />
                <input value={entry.text} onChange={(event) => updateScheduleExceptionEntry(entry.id, { text: event.target.value })} maxLength={300} placeholder="Extra plan" aria-label="Extra item description" />
                <button type="button" onClick={() => removeScheduleExceptionEntry(entry.id)} aria-label="Remove this extra item" className="schedule-remove">×</button>
              </div>
            ))}
          </div>

          <div className="schedule-toolbar">
            <button type="button" onClick={addScheduleExceptionEntry} className="schedule-btn green-outline">＋ Add extra</button>
            <button type="button" onClick={saveScheduleException} className="schedule-btn green">Save extras</button>
          </div>

          {scheduleExceptionMessage && <div role="status" className="schedule-status" style={{ color: "#52746E" }}>{scheduleExceptionMessage}</div>}

          {scheduleExceptions.length > 0 && (
            <div className="schedule-saved">
              <div className="schedule-eyebrow">Saved extras</div>
              {scheduleExceptions.map((item) => (
                <div key={item.id} className="schedule-saved-row">
                  <span>{item.start_date === item.end_date ? item.start_date : `${item.start_date} – ${item.end_date}`} · {(item.entries || []).map((entry) => entry.text).filter(Boolean).join(" · ")}</span>
                  <button type="button" onClick={() => deleteScheduleException(item.id)} className="schedule-remove-link">Remove</button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </ToolPanel>
  );
}
