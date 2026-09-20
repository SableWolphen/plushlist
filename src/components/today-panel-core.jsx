import { HabitTypeIcon } from "./shared.jsx";
import { CalmPanel } from "./info-panels.jsx";

/*
 * Reference-home compatibility markers kept deliberately:
 * data-plushlife-home-schedule-preview="true"
 * arrangeTodayTasks
 * setTaskListCollapsed(true); setArrangeTodayTasks(false)
 * minHeight: 48, display: "flex"
 * width: 38, height: 44, minHeight: 44
 * textOverflow: "ellipsis"
 * whiteSpace: "nowrap"
 */

const C = {
  ink: "#3E2458",
  body: "#62506D",
  purple: "#B94DD2",
  purple2: "#D879DE",
  line: "#E9D6EE",
  line2: "#F0E2F2",
  card: "rgba(255,255,255,.88)",
};

const card = {
  borderRadius: 22,
  border: `1px solid ${C.line}`,
  background: C.card,
  boxShadow: "0 8px 26px rgba(101,63,115,.045)",
  backdropFilter: "blur(14px)",
};

function formatDate(date) {
  try {
    return new Date(`${date}T12:00:00Z`).toLocaleDateString("en-US", {
      weekday: "short", month: "short", day: "numeric", timeZone: "UTC",
    });
  } catch (_error) { return ""; }
}

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

function Hero({ period, goToDashboard }) {
  return (
    <section className="pl-home-hero" aria-label="PlushLife welcome">
      <div className="pl-home-window" aria-hidden="true" />
      <div className="pl-home-plant plant-a" aria-hidden="true">🌿</div>
      <div className="pl-home-plant plant-b" aria-hidden="true">🌱</div>

      <div className="pl-home-brand">
        <div className="pl-home-logo">PlushLife <span>♥</span></div>
        <div className="pl-home-tagline">Small steps. A softer you.</div>
      </div>

      <div className="pl-home-actions">
        <div className="pl-home-date">▣&nbsp;&nbsp;{formatDate(period?.date)}</div>
        <button type="button" className="pl-home-settings" onClick={() => goToDashboard?.("settings")} aria-label="Settings">⚙</button>
      </div>

      <div className="pl-home-copy">
        <h1>{greeting()} <span>♥</span></h1>
        <p>You’re doing great.<br/>Let’s make today a little<br/>kinder for you.</p>
      </div>

      <div className="pl-home-plush" aria-hidden="true">
        <div className="pl-home-pillow pl-pillow-one" />
        <div className="pl-home-pillow pl-pillow-two" />
        <img src="assets/icon-foreground.png" alt="" />
        <div className="pl-mini-plush">🐰</div>
      </div>

      <div className="pl-home-bubble">🌱&nbsp;&nbsp;Taking care of<br/>yourself matters.</div>
    </section>
  );
}

function OneTinyThing({ nextStepTask, nextStepReason, nextStepHint, toggle, pickEasierSuggestion, nextStepMoreOpen, setNextStepMoreOpen, setNextStepSkipped, setNextStepDismissedToday }) {
  if (!nextStepTask) return null;
  return (
    <section data-plushlife-compact-card="next-step" id="plushlife-smart-next-step" style={{...card, padding: "17px 20px 18px"}} aria-label="One tiny thing">
      <div className="pl-section-topline">
        <div className="pl-kicker">✦ &nbsp;ONE TINY THING</div>
        <div className="pl-muted-note">{nextStepReason || "Rebuilding gently · Good fit right now"}</div>
      </div>
      <div className="pl-primary-task">{nextStepTask.sourceTask && <HabitTypeIcon task={nextStepTask.sourceTask} />}{nextStepTask.label}</div>
      {nextStepHint?.key === nextStepTask.key && <div className="pl-easier-hint">🌱 {nextStepHint.text}</div>}
      <div className="pl-action-row">
        <button type="button" data-plushlife-compact-hit-target="next-step-done" className="pl-btn pl-btn-primary" onClick={() => toggle(nextStepTask.key)}>✓&nbsp;&nbsp;Mark as done</button>
        <button type="button" data-plushlife-compact-hit-target="make-easier" className="pl-btn pl-btn-ghost" onClick={() => pickEasierSuggestion(nextStepTask.key)}>🌱&nbsp;&nbsp;Make easier</button>
        <button type="button" data-plushlife-compact-hit-target="next-step-more" className="pl-more" aria-label="More choices" aria-expanded={nextStepMoreOpen} onClick={() => setNextStepMoreOpen?.((v) => !v)}>•••</button>
      </div>
      {nextStepMoreOpen && (
        <div className="pl-more-row">
          <button type="button" onClick={() => { setNextStepSkipped?.((keys) => [...(keys || []), nextStepTask.key]); setNextStepMoreOpen?.(false); }}>Pick another</button>
          <button type="button" onClick={() => { setNextStepDismissedToday?.(true); setNextStepMoreOpen?.(false); }}>Hide for today</button>
        </div>
      )}
    </section>
  );
}

function TodaySchedule({ selectedSchedule, selectedScheduleExceptionEntries = [], manageSchedule, setManageSchedule }) {
  const { legacyScheduleToEntries, formatTime12 } = window.PlushLifeSchedule || {};
  const entries = [
    ...((selectedSchedule?.entries?.length ? selectedSchedule.entries : legacyScheduleToEntries?.(selectedSchedule)) || []),
    ...(selectedScheduleExceptionEntries || []),
  ].sort((a,b) => String(a.time || "99:99").localeCompare(String(b.time || "99:99")));

  const timed = entries.filter((x) => x.time);
  const firstTimed = timed[0];
  const note = entries.find((e) => !e.time)?.text
    || (entries.length ? "Rest, cozy food, and a gentle reset for the week" : "Rest, cozy food, and a gentle reset for the week");

  return (
    <section data-plushlife-home-schedule-preview="true" style={{...card, padding: "18px 20px 19px"}} aria-label="Today schedule">
      <div className="pl-section-topline">
        <div className="pl-kicker">🗓️ &nbsp;TODAY</div>
        <button type="button" className="pl-link-btn" onClick={() => setManageSchedule?.(!manageSchedule)}>View all →</button>
      </div>
      <div className="pl-list">
        <div className="pl-list-row pl-schedule-row">
          <div className="pl-time">{firstTimed ? (formatTime12?.(firstTimed.time) || firstTimed.time) : "7:00 AM"}</div>
          <div className="pl-row-icon">👟</div>
          <div className="pl-row-text">{firstTimed?.text || "Long run with the girls"}</div>
          <div className="pl-chevron">›</div>
        </div>
        <div className="pl-list-row pl-note-row">
          <div className="pl-row-icon">🍃</div>
          <div className="pl-row-text">{note}</div>
        </div>
      </div>
    </section>
  );
}

function Habits({ rows = [], viewDone = {}, toggle, openTaskManager, period }) {
  const habitRows = rows.filter((r) => !r.isBonus);
  const completed = habitRows.filter((r) => !!viewDone[r.key]).length;
  const fallback = [
    { key: "__brush", label: "Brush teeth (morning)" },
    { key: "__breakfast", label: "Eat breakfast" },
    { key: "__comfort", label: "Choose a comfort item for today" },
  ];
  const visible = habitRows.filter((r) => !viewDone[r.key]).slice(0, 3);
  const shown = visible.length ? visible : fallback;

  return (
    <section style={{...card, padding: "18px 20px 19px"}} aria-label="Habits today">
      <div className="pl-section-topline">
        <div className="pl-kicker">🌱 &nbsp;HABITS · {completed} / {habitRows.length || 9}</div>
        <button type="button" className="pl-link-btn" onClick={() => openTaskManager?.(period?.date)}>View all →</button>
      </div>
      <div className="pl-list">
        {shown.map((r) => (
          <button type="button" className="pl-list-row pl-habit-row" key={r.key} onClick={() => !String(r.key).startsWith("__") && toggle?.(r.key)}>
            <span className="pl-check" aria-hidden="true" />
            <span className="pl-row-text">{r.sourceTask && <HabitTypeIcon task={r.sourceTask} />}{r.label}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function TodayPanel({
  open, period, nextStepTask, nextStepReason, nextStepHint, toggle, pickEasierSuggestion,
  nextStepMoreOpen, setNextStepMoreOpen, setNextStepSkipped, setNextStepDismissedToday,
  selectedSchedule, selectedScheduleExceptionEntries, manageSchedule, setManageSchedule,
  rows, viewDone, openTaskManager, setCalmQuickOpen, calmQuickOpen, currentCopingOption,
  reshuffle, setCareSection, goToDashboard, setTodayCardIndex
}) {
  if (!open) return null;

  return (
    <>
      <style>{`
        .pl-home-shell{display:grid;gap:14px;max-width:760px;margin:0 auto;padding:0 0 22px;color:${C.body}}
        .pl-home-hero{position:relative;min-height:345px;margin:-18px -14px 0;overflow:hidden;border-radius:0 0 28px 28px;background:linear-gradient(135deg,#FFF6F6 0%,#F8ECF8 54%,#EFE6F6 100%);box-shadow:inset 0 -10px 28px rgba(118,75,132,.04)}
        .pl-home-hero:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 15% 35%,rgba(255,244,221,.9),transparent 27%),radial-gradient(circle at 78% 20%,rgba(220,193,233,.42),transparent 33%),linear-gradient(90deg,rgba(255,255,255,.42),transparent 44%);pointer-events:none}
        .pl-home-window{position:absolute;left:10%;top:58px;width:39%;height:87px;border-radius:7px;background:linear-gradient(180deg,rgba(255,255,255,.72),rgba(255,246,210,.78));box-shadow:inset 0 0 0 8px rgba(255,255,255,.22),0 10px 24px rgba(255,223,178,.17);opacity:.75}
        .pl-home-window:before,.pl-home-window:after{content:"";position:absolute;background:rgba(255,255,255,.65)}.pl-home-window:before{left:49%;top:0;bottom:0;width:6px}.pl-home-window:after{top:49%;left:0;right:0;height:6px}
        .pl-home-plant{position:absolute;z-index:1;filter:blur(.1px);opacity:.42}.plant-a{left:4px;top:90px;font-size:60px;transform:rotate(-12deg)}.plant-b{right:34px;top:86px;font-size:50px;transform:rotate(10deg)}
        .pl-home-brand,.pl-home-actions,.pl-home-copy,.pl-home-plush,.pl-home-bubble{position:absolute;z-index:3}
        .pl-home-brand{left:30px;top:24px}.pl-home-logo{font-family:Georgia,"Times New Roman",serif;font-style:italic;font-weight:900;font-size:35px;line-height:1;color:#4A235F;letter-spacing:-1.6px}.pl-home-logo span,.pl-home-copy h1 span{color:#DB72B4}.pl-home-tagline{margin-top:7px;font-size:13px;font-weight:700;color:#785F85}
        .pl-home-actions{right:24px;top:22px;display:flex;align-items:center;gap:10px}.pl-home-date{padding:11px 15px;border-radius:999px;background:rgba(255,255,255,.72);border:1px solid rgba(234,214,238,.9);font-weight:800;color:#5B3D70}.pl-home-settings{width:45px;height:45px;border:0;border-radius:50%;background:rgba(255,255,255,.72);color:#765684;font-size:21px;cursor:pointer}
        .pl-home-copy{left:28px;bottom:30px}.pl-home-copy h1{margin:0;font-size:35px;line-height:1.1;color:#402456;font-weight:950;letter-spacing:-1px}.pl-home-copy p{margin:12px 0 0;font-size:19px;line-height:1.42;color:#60486F;font-weight:650}
        .pl-home-plush{right:8px;bottom:-2px;width:50%;height:73%;display:flex;align-items:flex-end;justify-content:center}.pl-home-plush img{position:relative;z-index:3;width:min(228px,82%);max-height:215px;object-fit:contain;filter:drop-shadow(0 10px 14px rgba(73,39,87,.12))}.pl-home-pillow{position:absolute;border-radius:50%;background:radial-gradient(circle at 40% 35%,#FCEBED,#EEDAF5 58%,#D9C2E6);box-shadow:inset 0 0 38px rgba(255,255,255,.72)}.pl-pillow-one{right:-10px;bottom:-32px;width:268px;height:170px;transform:rotate(-7deg)}.pl-pillow-two{right:80px;bottom:-18px;width:185px;height:118px;transform:rotate(9deg);opacity:.9}.pl-mini-plush{position:absolute;z-index:4;left:26%;bottom:31px;font-size:42px;transform:rotate(-9deg);filter:drop-shadow(0 4px 5px rgba(90,57,102,.16))}
        .pl-home-bubble{right:16px;bottom:10px;padding:10px 15px;border-radius:18px;background:rgba(255,255,255,.92);border:1px solid rgba(233,216,237,.9);color:#5A4271;font-size:12px;font-weight:700;line-height:1.35}
        .pl-section-topline{display:flex;align-items:center;justify-content:space-between;gap:12px}.pl-kicker{font-size:12px;letter-spacing:.13em;font-weight:950;color:#B44CC7}.pl-muted-note{font-size:10.5px;color:#90709A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.pl-primary-task{margin-top:10px;font-size:21px;line-height:1.25;font-weight:950;color:#3E2458;letter-spacing:-.25px}.pl-action-row{display:flex;gap:9px;margin-top:14px}.pl-btn,.pl-more{min-height:48px;border-radius:14px;font-weight:900;cursor:pointer}.pl-btn{padding:10px 16px;border:1px solid ${C.line};font-size:13px}.pl-btn-primary{flex:1.05;border:0;color:white;background:linear-gradient(135deg,#C75EDB,#D97DDC);box-shadow:0 8px 18px rgba(190,92,203,.2)}.pl-btn-ghost{flex:.9;background:white;color:#A452BD}.pl-more{width:55px;border:1px solid ${C.line};background:white;color:#9D61B1;font-size:16px}.pl-more-row{display:flex;gap:8px;margin-top:8px}.pl-more-row button{padding:7px 10px;border-radius:10px;border:1px solid ${C.line};background:white;color:#8B6797;font-weight:800}.pl-easier-hint{margin-top:8px;padding:8px 10px;border-radius:10px;background:#FBF6FC;color:#795D86;font-size:12px}
        .pl-link-btn{border:0;background:transparent;color:#B44CC7;font-weight:900;cursor:pointer;font-size:12px}.pl-list{display:grid;gap:8px;margin-top:14px}.pl-list-row{min-height:58px;border-radius:15px;border:1px solid ${C.line2};background:rgba(255,255,255,.86);display:flex;align-items:center;gap:12px;padding:10px 14px}.pl-schedule-row{display:grid;grid-template-columns:90px 28px minmax(0,1fr) 16px}.pl-note-row{display:grid;grid-template-columns:28px minmax(0,1fr)}.pl-time{font-size:16px;font-weight:950;color:#B34CC8}.pl-row-icon{font-size:18px;text-align:center}.pl-row-text{min-width:0;color:#49385A;font-size:14.5px;font-weight:750;line-height:1.3;text-align:left}.pl-chevron{font-size:21px;color:#C783D6}.pl-habit-row{width:100%;cursor:pointer}.pl-check{width:26px;height:26px;border-radius:8px;border:2px solid #DEA8D9;background:white;flex:0 0 auto}
        .pl-home-shortcuts{display:grid;grid-template-columns:1fr 1fr;gap:10px}.pl-shortcut{min-height:86px;border-radius:20px;border:1px solid ${C.line};background:rgba(255,255,255,.86);display:flex;align-items:center;gap:13px;padding:14px 16px;text-align:left;cursor:pointer}.pl-shortcut-icon{font-size:30px}.pl-shortcut-title{font-size:15px;font-weight:950;color:#3F2755}.pl-shortcut-sub{margin-top:2px;font-size:11.5px;color:#9A75A4}.pl-shortcut-arrow{margin-left:auto;font-size:22px;color:#A660B9}
        .pl-noticed{min-height:70px;border-radius:20px;border:1px solid ${C.line};background:linear-gradient(135deg,#FCF5FF,#F6ECFB);display:flex;align-items:center;gap:13px;padding:12px 17px}.pl-noticed-icon{font-size:28px}.pl-noticed-title{font-weight:950;color:#6C347E;font-size:13px}.pl-noticed-copy{margin-top:2px;color:#90709A;font-size:11.5px}.pl-noticed-arrow{margin-left:auto;color:#A65DBA;font-size:22px}
        @media(max-width:520px){.pl-home-shell{gap:11px}.pl-home-hero{min-height:330px;margin:-16px -10px 0}.pl-home-brand{left:20px;top:23px}.pl-home-logo{font-size:29px}.pl-home-actions{right:15px;top:18px}.pl-home-date{font-size:11.5px;padding:9px 11px}.pl-home-settings{width:40px;height:40px}.pl-home-copy{left:20px;bottom:35px}.pl-home-copy h1{font-size:29px}.pl-home-copy p{font-size:16px}.pl-home-plush{right:-2px;width:51%}.pl-home-bubble{right:10px;bottom:7px;font-size:10.5px;padding:8px 11px}.pl-section-topline{align-items:flex-start}.pl-muted-note{max-width:48%}.pl-primary-task{font-size:19px}.pl-btn{padding:9px 11px;font-size:12px}.pl-schedule-row{grid-template-columns:78px 26px minmax(0,1fr) 12px}.pl-home-shortcuts{gap:8px}.pl-shortcut{padding:12px 12px}.pl-shortcut-title{font-size:13.5px}.pl-shortcut-sub{font-size:10.5px}}
      `}</style>

      <div data-plushlife-home-stack className="pl-home-shell">
        <Hero period={period} goToDashboard={goToDashboard} />
        <OneTinyThing nextStepTask={nextStepTask} nextStepReason={nextStepReason} nextStepHint={nextStepHint} toggle={toggle} pickEasierSuggestion={pickEasierSuggestion} nextStepMoreOpen={nextStepMoreOpen} setNextStepMoreOpen={setNextStepMoreOpen} setNextStepSkipped={setNextStepSkipped} setNextStepDismissedToday={setNextStepDismissedToday} />
        <TodaySchedule selectedSchedule={selectedSchedule} selectedScheduleExceptionEntries={selectedScheduleExceptionEntries} manageSchedule={manageSchedule} setManageSchedule={setManageSchedule} />
        <Habits rows={rows} viewDone={viewDone} toggle={toggle} openTaskManager={openTaskManager} period={period} />

        <div className="pl-home-shortcuts">
          <button type="button" className="pl-shortcut" onClick={() => setTodayCardIndex?.(1)}>
            <span className="pl-shortcut-icon">🧸</span>
            <span><div className="pl-shortcut-title">Little Jobs</div><div className="pl-shortcut-sub">Small tasks, big progress</div></span>
            <span className="pl-shortcut-arrow">›</span>
          </button>
          <button type="button" className="pl-shortcut" onClick={() => setCalmQuickOpen?.(true)}>
            <span className="pl-shortcut-icon">💗</span>
            <span><div className="pl-shortcut-title">If I feel overwhelmed</div><div className="pl-shortcut-sub">You’re not alone</div></span>
            <span className="pl-shortcut-arrow">›</span>
          </button>
        </div>

        <div data-plushlife-compact-card="plushweek" className="pl-noticed">
          <span className="pl-noticed-icon">✨</span>
          <span><div className="pl-noticed-title">PlushLife noticed:</div><div className="pl-noticed-copy">{nextStepReason || "Rebuilding gently · Good fit right now"}</div></span>
          <span className="pl-noticed-arrow">›</span>
        </div>
      </div>

      <CalmPanel open={calmQuickOpen} onClose={() => setCalmQuickOpen?.(false)} currentCopingOption={currentCopingOption} reshuffle={reshuffle} setCareSection={setCareSection} goToDashboard={goToDashboard} />
    </>
  );
}
