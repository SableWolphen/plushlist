export function CareHistory({ dailyCheckInHistory = [], reflectionHistory = [], checkInHistoryStatus, journalHistoryStatus, retryCareHistory, setCheckInViewerDate, setReflectionViewerDate, openTodayJournal, CHECKIN_MOODS = [] }) {
  const [tab, setTab] = React.useState("checkins");
  const [shown, setShown] = React.useState(3);
  const checkins = tab === "checkins";
  const rows = checkins ? [...dailyCheckInHistory].sort((a, b) => b.check_date.localeCompare(a.check_date)) : reflectionHistory;
  const status = checkins ? checkInHistoryStatus : journalHistoryStatus;
  return <section className="pl-care-history" aria-label="Your private history">
    <h3>Your history</h3>
    <p>Check-ins and journals, saved for you.</p>
    <div role="tablist" aria-label="History type">
      {[['checkins', 'Check-ins', dailyCheckInHistory.length], ['journals', 'Journals', reflectionHistory.length]].map(([id, label, count]) => <button key={id} type="button" role="tab" aria-selected={tab === id} onClick={() => { setTab(id); setShown(3); }}>{label} ({count})</button>)}
    </div>
    <div role="tabpanel" aria-label={checkins ? "Check-in history" : "Journal history"}>
      {status === "loading" && <p role="status">Loading your saved entries…</p>}
      {status === "error" && <div role="alert"><p>We couldn’t load your history. Try again to reconnect.</p><button type="button" onClick={retryCareHistory}>Retry history</button></div>}
      {status === "ready" && !rows.length && <p>{checkins ? "Your saved check-ins will appear here." : "Your saved journals will appear here."}</p>}
      <ol>{rows.slice(0, shown).map((entry) => {
        const date = checkins ? entry.check_date : entry.note_date;
        const mood = CHECKIN_MOODS.find(([value]) => value === entry.mood);
        return <li key={date}><button type="button" onClick={() => checkins ? setCheckInViewerDate(date) : setReflectionViewerDate(date)}>
          <strong>{new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}</strong>
          <span>{checkins ? [mood && `${mood[1]} ${mood[2]}`, entry.energy && `${entry.energy} energy`, entry.capacity && `${entry.capacity} capacity`].filter(Boolean).join(" · ") || "Saved check-in" : (entry.body || "Saved journal").slice(0, 140)}</span>
          <span aria-hidden="true">›</span>
        </button></li>;
      })}</ol>
      {shown < rows.length && <button type="button" onClick={() => setShown((count) => count + 20)}>Show more ({rows.length - shown})</button>}
    </div>
    <button type="button" onClick={openTodayJournal}>Open today’s journal</button>
  </section>;
}
