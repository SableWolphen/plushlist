// Module split phase 7 (eleventh slice): the PlushCalendar / "week"
// dashboard tab (dashboard === "week"), extracted out of GlowUpTracker the
// same way as CarePanel and ProgressPanel. Like ProgressPanel, its root is a
// JSX fragment (`<>...</>`) with multiple top-level siblings, not a single
// wrapped element -- the fragment markers below are load-bearing, not
// decorative wrapping to strip.
//
// offsetDate/dayIdForDate/reflectionPromptForDay/taskIsScheduledForDate/
// taskIsOptional are read directly from window.PlushLifeSchedule (a UMD
// module), matching every other phase-7 slice's pattern for schedule
// helpers rather than threading them through as props.
import { HabitTypeIcon } from "./shared.jsx";

export function WeekPanel({ open, openTodayJournal, weekCardIndex, setWeekCardIndex, weekSwipeStartX, weekSwipeStartY, reflectionCalendarMonth, setReflectionCalendarMonth, reflectionMonthDate, reflectionMonthStart, reflectionMonthDays, reflectionDateSet, dailyCheckInHistory, restDatesSet, selectedProgressDate, setSelectedProgressDate, dayCompletionPct, setDayViewDate, setActive, setReflectionViewerDate, setCheckInViewerDate, reflectionHistory, journalHistoryExpanded, setJournalHistoryExpanded, weeklyIntentionHistory, weeklyIntentionHistoryExpanded, setWeeklyIntentionHistoryExpanded, period, calendarWeekOffset, setCalendarWeekOffset, calendarWeekPreviewDate, setCalendarWeekPreviewDate, trackerTasks, dayViewDate, dayViewExpanded, setDayViewExpanded, longHistoryByDate, isTaskPausedOnDate, markPastTasksDone, done, toggle, isHistoricalView, habitTasks, habitGardenGrowthPct, habitGardenTotalCheckIns, habitGardenOpen, setHabitGardenOpen, CHECKIN_MOODS }) {
  if (!open) return null;
  const { offsetDate, dayIdForDate, reflectionPromptForDay, taskIsScheduledForDate, taskIsOptional } = window.PlushLifeSchedule;
  return (
  <>
        <button type="button" onClick={openTodayJournal} style={{ width: "100%", marginBottom: 9, padding: "10px 12px", borderRadius: 12, border: "1px solid #D9B8E8", background: "linear-gradient(135deg,#FBF3FE,#FFF9FD)", color: "#8E4EAA", fontWeight: 900, fontSize: 12, cursor: "pointer" }}>📝 Open today's PlushJournal</button>
        <div style={{ display: "flex", gap: 6, marginBottom: 8, alignItems: "center" }}>
          <div role="tablist" aria-label="Calendar view" style={{ flex: 1, display: "flex", gap: 4, padding: 4, borderRadius: 12, background: "#F0E4F7" }}>
            {[
              [0, "📅 Month"],
              [1, "🗓️ Week"],
              [2, "📆 Day"],
            ].map(([index, cardLabel]) => (
              <button key={index} type="button" role="tab" aria-selected={weekCardIndex === index} onClick={() => setWeekCardIndex(index)} style={{ flex: 1, minWidth: 0, padding: "7px 4px", borderRadius: 9, border: "none", background: weekCardIndex === index ? "white" : "transparent", color: weekCardIndex === index ? "#7E3D99" : "#8C6B9E", fontWeight: 800, fontSize: 11.5, cursor: "pointer", boxShadow: weekCardIndex === index ? "0 1px 4px rgba(126,61,153,.18)" : "none" }}>{cardLabel}</button>
            ))}
          </div>
        </div>
        <div
          onTouchStart={(event) => { event.stopPropagation(); weekSwipeStartX.current = event.touches[0]?.clientX ?? null; weekSwipeStartY.current = event.touches[0]?.clientY ?? null; }}
          onTouchEnd={(event) => {
            event.stopPropagation();
            const startX = weekSwipeStartX.current;
            const startY = weekSwipeStartY.current;
            const endX = event.changedTouches[0]?.clientX;
            const endY = event.changedTouches[0]?.clientY;
            weekSwipeStartX.current = null;
            weekSwipeStartY.current = null;
            if (startX == null || endX == null || startY == null || endY == null) return;
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            if (Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY) * 1.5) return;
            setWeekCardIndex((index) => (index + (deltaX < 0 ? 1 : 2)) % 3);
          }}
          style={{ touchAction: "pan-y" }}>
        {weekCardIndex === 0 && <>
        <div style={{ marginBottom: 18, padding: 16, borderRadius: 18, background: "#FFFFFF99", border: "1px solid #D9C8EA" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.14em", fontWeight: 900, color: "#8E4EAA" }}>📅 PROGRESS CALENDAR</div>
              <div style={{ marginTop: 4, fontSize: 11.5, color: "#8C6B9E" }}>Darker means more completed that day. A purple dot means you saved a private reflection — tap a past day to open it.</div>
            </div>
            <div style={{ display: "flex", gap: 5 }}>
              <button type="button" aria-label="Previous month" onClick={() => {
                const previous = new Date(Date.UTC(reflectionMonthDate.getUTCFullYear(), reflectionMonthDate.getUTCMonth() - 1, 1));
                setReflectionCalendarMonth(previous.toISOString().slice(0, 7));
              }} style={{ padding: "5px 8px", borderRadius: 8, border: "1px solid #DCC9E8", background: "white", color: "#8E4EAA", cursor: "pointer" }}>←</button>
              <button type="button" aria-label="Next month" disabled={reflectionCalendarMonth >= period.date.slice(0, 7)} onClick={() => {
                const next = new Date(Date.UTC(reflectionMonthDate.getUTCFullYear(), reflectionMonthDate.getUTCMonth() + 1, 1));
                setReflectionCalendarMonth(next.toISOString().slice(0, 7));
              }} style={{ padding: "5px 8px", borderRadius: 8, border: "1px solid #DCC9E8", background: "white", color: "#8E4EAA", cursor: reflectionCalendarMonth >= period.date.slice(0, 7) ? "not-allowed" : "pointer", opacity: reflectionCalendarMonth >= period.date.slice(0, 7) ? 0.4 : 1 }}>→</button>
            </div>
          </div>

          <div style={{ marginTop: 10, textAlign: "center", color: "#5B4B6B", fontSize: 14, fontWeight: 900 }}>
            {reflectionMonthDate.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 4, marginTop: 9 }}>
            {["M", "T", "W", "T", "F", "S", "S"].map((label, index) => <div key={index} style={{ textAlign: "center", fontSize: 10, fontWeight: 900, color: "#9A86A7" }}>{label}</div>)}
            {Array.from({ length: reflectionMonthStart }).map((_, index) => <div key={"blank-" + index} />)}
            {Array.from({ length: reflectionMonthDays }, (_, index) => {
              const number = index + 1;
              const date = reflectionCalendarMonth + "-" + String(number).padStart(2, "0");
              const hasReflection = reflectionDateSet.has(date);
              const checkIn = dailyCheckInHistory.find((entry) => entry.check_date === date) || null;
              const moodOption = CHECKIN_MOODS.find(([value]) => value === checkIn?.mood);
              const moodEmoji = moodOption?.[1] || null;
              const isRestDay = restDatesSet.has(date);
              const isFutureDate = date > period.date;
              const isSelectedDate = date === selectedProgressDate;
              const pct = dayCompletionPct(date);
              const bg = isRestDay ? "#8FD4B8" : pct === null ? (isSelectedDate ? "#F4E8FA" : "rgba(255,255,255,0.82)") : pct === 0 ? "#F7EFFA" : pct < 50 ? "#E4C6EE" : pct < 100 ? "#C77DD6" : "#8E4EAA";
              const textColor = isFutureDate ? "#C7BBCF" : isRestDay || pct >= 50 ? "#FFFFFF" : "#6D5A7C";
              const calendarTitle = [isRestDay ? "Resting" : pct === null ? null : `${pct}% complete`, moodOption ? `Feeling ${moodOption[2]}` : null, checkIn?.energy ? `${checkIn.energy} energy` : null, checkIn?.day_type ? `${checkIn.day_type} day` : null].filter(Boolean).join(" · ");
              return <button key={date} type="button" disabled={isFutureDate} title={calendarTitle || undefined} aria-label={calendarTitle ? `${number}: ${calendarTitle}` : String(number)} onClick={() => {
                if (isFutureDate) return;
                setSelectedProgressDate(date);
                setDayViewDate(date);
                if (date === period.date) setActive("daily");
                if (hasReflection && !checkIn) setReflectionViewerDate(date);
                if (checkIn) setCheckInViewerDate(date);
              }} style={{ position: "relative", minHeight: 34, borderRadius: 9, border: isSelectedDate ? "2px solid #A65DC1" : "1px solid #E9DDEC", background: bg, color: textColor, fontWeight: 800, cursor: isFutureDate ? "not-allowed" : "pointer", opacity: isFutureDate ? 0.5 : 1 }}>
                {isRestDay ? "🌴" : number}{moodEmoji && <span aria-label={`Feeling ${moodOption[2]}`} style={{ position: "absolute", left: 3, bottom: 1, fontSize: 11 }}>{moodEmoji}</span>}{hasReflection && <span aria-label="Reflection saved" style={{ position: "absolute", right: 4, bottom: 2, color: textColor === "#FFFFFF" ? "#FFFFFF" : "#A65DC1", fontSize: 12 }}>•</span>}
              </button>;
            })}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 10.5, color: "#8C6B9E", flexWrap: "wrap" }}>
            Less
            <span style={{ width: 12, height: 12, borderRadius: 3, background: "#F7EFFA", display: "inline-block" }} />
            <span style={{ width: 12, height: 12, borderRadius: 3, background: "#E4C6EE", display: "inline-block" }} />
            <span style={{ width: 12, height: 12, borderRadius: 3, background: "#C77DD6", display: "inline-block" }} />
            <span style={{ width: 12, height: 12, borderRadius: 3, background: "#8E4EAA", display: "inline-block" }} />
            More
            <span style={{ width: 12, height: 12, borderRadius: 3, background: "#8FD4B8", display: "inline-block", marginLeft: 8 }} /> 🌴 Resting
          </div>
        </div>
        <details style={{ marginBottom: 10, padding: 14, borderRadius: 16, background: "#FFFFFF99", border: "1px solid #D9C8EA" }}>
          <summary style={{ cursor: "pointer", color: "#8E4EAA", fontSize: 11, letterSpacing: "0.14em", fontWeight: 900 }}>📖 PLUSHJOURNAL HISTORY <span style={{ float: "right", color: "#A65DC1" }}>{reflectionHistory.length} entries</span></summary>
          <div style={{ marginTop: 7, fontSize: 11.5, color: "#8C6B9E" }}>Your private dated reflections, newest first.</div>
          {reflectionHistory.length ? (
            <div style={{ display: "grid", gap: 7, marginTop: 10 }}>
              {reflectionHistory.slice(0, journalHistoryExpanded ? reflectionHistory.length : 5).map((entry) => (
                <button key={entry.note_date} type="button" onClick={() => setReflectionViewerDate(entry.note_date)} style={{ width: "100%", padding: "10px 11px", borderRadius: 11, border: "1px solid #E6D4F2", background: "#FFF9FD", color: "#5B4B6B", cursor: "pointer", textAlign: "left" }}>
                  <span style={{ display: "block", fontSize: 10.5, fontWeight: 900, color: "#A65DC1" }}>{new Date(`${entry.note_date}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}</span>
                  <span style={{ display: "block", marginTop: 3, fontSize: 11.5, fontStyle: "italic", color: "#806B8D" }}>{entry.prompt || reflectionPromptForDay(dayIdForDate(entry.note_date), entry.note_date, "What would you like to reflect on?")}</span>
                  <span style={{ display: "block", marginTop: 4, fontSize: 12.5, lineHeight: 1.4 }}>{entry.body.length > 120 ? `${entry.body.slice(0, 120).trim()}…` : entry.body}</span>
                </button>
              ))}
              {reflectionHistory.length > 5 && <button type="button" onClick={() => setJournalHistoryExpanded((expanded) => !expanded)} style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #D9B8E8", background: "white", color: "#8E4EAA", fontWeight: 900, cursor: "pointer" }}>{journalHistoryExpanded ? "Show fewer entries" : `Show all ${reflectionHistory.length} entries`}</button>}
            </div>
          ) : <div style={{ marginTop: 10, padding: "10px 11px", borderRadius: 11, background: "#FBF7FD", color: "#927C9E", fontSize: 12 }}>Your first saved PlushJournal entry will appear here.</div>}
        </details>
        <details style={{ marginBottom: 18, padding: 14, borderRadius: 16, background: "#FFFFFF99", border: "1px solid #D9C8EA" }}>
          <summary style={{ cursor: "pointer", color: "#8E4EAA", fontSize: 11, letterSpacing: "0.14em", fontWeight: 900 }}>📮 PLUSHWEEK HISTORY <span style={{ float: "right", color: "#A65DC1" }}>{weeklyIntentionHistory.length} {weeklyIntentionHistory.length === 1 ? "week" : "weeks"}</span></summary>
          <div style={{ marginTop: 7, fontSize: 11.5, color: "#8C6B9E" }}>Your saved weekly intentions, newest first.</div>
          {weeklyIntentionHistory.length ? <div style={{ display: "grid", gap: 7, marginTop: 10 }}>
            {weeklyIntentionHistory.slice(0, weeklyIntentionHistoryExpanded ? weeklyIntentionHistory.length : 5).map((entry) => {
              const weekEnd = offsetDate(entry.week_start, 6);
              return <div key={entry.week_start} style={{ padding: "10px 11px", borderRadius: 11, border: "1px solid #E6D4F2", background: "#FFF9FD", color: "#5B4B6B" }}>
                <div style={{ fontSize: 10.5, fontWeight: 900, color: "#A65DC1" }}>{new Date(`${entry.week_start}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" })} – {new Date(`${weekEnd}T12:00:00Z`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" })}</div>
                <div style={{ marginTop: 3, fontSize: 11.5, fontStyle: "italic", color: "#806B8D" }}>What do I want to carry with me this week?</div>
                <div style={{ marginTop: 4, fontSize: 12.5, lineHeight: 1.4, whiteSpace: "pre-wrap" }}>{entry.body}</div>
              </div>;
            })}
            {weeklyIntentionHistory.length > 5 && <button type="button" onClick={() => setWeeklyIntentionHistoryExpanded((expanded) => !expanded)} style={{ padding: "8px 10px", borderRadius: 10, border: "1px solid #D9B8E8", background: "white", color: "#8E4EAA", fontWeight: 900, cursor: "pointer" }}>{weeklyIntentionHistoryExpanded ? "Show fewer weeks" : `Show all ${weeklyIntentionHistory.length} weeks`}</button>}
          </div> : <div style={{ marginTop: 10, padding: "10px 11px", borderRadius: 11, background: "#FBF7FD", color: "#927C9E", fontSize: 12 }}>Your first saved PlushWeek intention will appear here.</div>}
        </details>
        </>}

        {weekCardIndex === 1 && (() => {
          const viewedWeekStart = offsetDate(period.weekStart, calendarWeekOffset * 7);
          const viewedWeekDates = Array.from({ length: 7 }, (_, index) => offsetDate(viewedWeekStart, index));
          return (
            <div style={{ marginBottom: 18, padding: 16, borderRadius: 18, background: "#FFFFFF99", border: "1px solid #D9C8EA" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div>
                  <div style={{ fontSize: 11, letterSpacing: "0.14em", fontWeight: 900, color: "#8E4EAA" }}>🗓️ WEEK VIEW</div>
                  <div style={{ marginTop: 4, fontSize: 11.5, color: "#8C6B9E" }}>Past days show what actually happened. Days ahead show what's planned — tap one to preview it.</div>
                </div>
                <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
                  <button type="button" aria-label="Previous week" onClick={() => setCalendarWeekOffset((offset) => offset - 1)} style={{ padding: "5px 8px", borderRadius: 8, border: "1px solid #DCC9E8", background: "white", color: "#8E4EAA", cursor: "pointer" }}>←</button>
                  <button type="button" aria-label="Next week" onClick={() => setCalendarWeekOffset((offset) => offset + 1)} style={{ padding: "5px 8px", borderRadius: 8, border: "1px solid #DCC9E8", background: "white", color: "#8E4EAA", cursor: "pointer" }}>→</button>
                </div>
              </div>
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: "#5B4B6B" }}>
                  {calendarWeekOffset === 0 ? "This week" : new Date(`${viewedWeekStart}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }) + " – " + new Date(`${offsetDate(viewedWeekStart, 6)}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </div>
                {calendarWeekOffset !== 0 && <button type="button" onClick={() => setCalendarWeekOffset(0)} style={{ padding: "5px 9px", borderRadius: 8, border: "1px solid #DCC9E8", background: "white", color: "#8E4EAA", fontWeight: 800, fontSize: 11, cursor: "pointer" }}>Today</button>}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0, 1fr))", gap: 5, marginTop: 10 }}>
                {viewedWeekDates.map((date) => {
                  const isFuture = date > period.date;
                  const isRestDay = restDatesSet.has(date);
                  const pct = isFuture ? null : dayCompletionPct(date);
                  const checkIn = dailyCheckInHistory.find((entry) => entry.check_date === date) || null;
                  const moodOption = CHECKIN_MOODS.find(([value]) => value === checkIn?.mood);
                  const moodEmoji = moodOption?.[1] || null;
                  const hasReflection = reflectionDateSet.has(date);
                  const isSelected = date === (isFuture ? calendarWeekPreviewDate : selectedProgressDate);
                  const plannedCount = isFuture ? trackerTasks.filter((task) => !task.archived_at && taskIsScheduledForDate(task, date)).length : null;
                  const bg = isFuture ? (isSelected ? "#F4E8FA" : "#FBF7FD") : isRestDay ? "#8FD4B8" : pct === null ? "rgba(255,255,255,0.82)" : pct === 0 ? "#F7EFFA" : pct < 50 ? "#E4C6EE" : pct < 100 ? "#C77DD6" : "#8E4EAA";
                  const textColor = isFuture ? "#8E4EAA" : isRestDay || pct >= 50 ? "#FFFFFF" : "#6D5A7C";
                  const dayLabel = new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" });
                  const dayNumber = Number(date.slice(8, 10));
                  return (
                    <button
                      key={date}
                      type="button"
                      onClick={() => {
                        if (isFuture) { setCalendarWeekPreviewDate(isSelected ? null : date); return; }
                        setSelectedProgressDate(date);
                        if (date === period.date) setActive("daily");
                        if (hasReflection && !checkIn) setReflectionViewerDate(date);
                        if (checkIn) setCheckInViewerDate(date);
                      }}
                      style={{ position: "relative", minHeight: 52, padding: "6px 2px", borderRadius: 10, border: isSelected ? "2px solid #A65DC1" : isFuture ? "1px dashed #DCC9E8" : "1px solid #E9DDEC", background: bg, color: textColor, cursor: "pointer" }}
                    >
                      <div style={{ fontSize: 9.5, fontWeight: 900, opacity: 0.85 }}>{dayLabel}</div>
                      <div style={{ marginTop: 2, fontSize: 14, fontWeight: 900 }}>{isRestDay && !isFuture ? "🌴" : dayNumber}</div>
                      {isFuture ? (plannedCount > 0 && <div style={{ marginTop: 2, fontSize: 9 }}>{plannedCount} planned</div>) : null}
                      {moodEmoji && <span aria-label={`Feeling ${moodOption[2]}`} style={{ position: "absolute", left: 3, bottom: 2, fontSize: 10 }}>{moodEmoji}</span>}
                      {hasReflection && <span aria-label="Reflection saved" style={{ position: "absolute", right: 4, bottom: 2, color: textColor === "#FFFFFF" ? "#FFFFFF" : "#A65DC1", fontSize: 11 }}>•</span>}
                    </button>
                  );
                })}
              </div>
              {calendarWeekPreviewDate && viewedWeekDates.includes(calendarWeekPreviewDate) && (() => {
                const previewTasks = trackerTasks.filter((task) => !task.archived_at && taskIsScheduledForDate(task, calendarWeekPreviewDate));
                return (
                  <div style={{ marginTop: 10, padding: "10px 12px", borderRadius: 12, background: "#FBF7FD", border: "1px solid #E3C9EC" }}>
                    <div style={{ fontSize: 11.5, fontWeight: 900, color: "#7A3D93" }}>{new Date(`${calendarWeekPreviewDate}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
                    {previewTasks.length === 0 ? (
                      <div style={{ marginTop: 6, fontSize: 11.5, color: "#8C6B9E" }}>Nothing scheduled yet for that day.</div>
                    ) : (
                      <div style={{ display: "grid", gap: 5, marginTop: 8 }}>
                        {previewTasks.map((task) => (
                          <div key={task.task_key} style={{ padding: "6px 9px", borderRadius: 8, background: "white", border: "1px solid #EADDE2", fontSize: 11.5, color: "#5B4B6B" }}>
                            {taskIsOptional(task) ? "⭐ " : ""}{task.task}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          );
        })()}

        {weekCardIndex === 2 && (() => {
          const isFuture = dayViewDate > period.date;
          const isRestDay = restDatesSet.has(dayViewDate);
          const pct = isFuture ? null : dayCompletionPct(dayViewDate);
          const checkIn = dailyCheckInHistory.find((entry) => entry.check_date === dayViewDate) || null;
          const moodOption = CHECKIN_MOODS.find(([value]) => value === checkIn?.mood);
          const previewTasks = trackerTasks.filter((task) => !task.archived_at && taskIsScheduledForDate(task, dayViewDate));
          const timeBucket = (task) => {
            if (!task.reminder_time) return "Anytime";
            const hour = Number(String(task.reminder_time).slice(0, 2));
            if (!Number.isFinite(hour)) return "Anytime";
            if (hour < 12) return "Morning";
            if (hour < 17) return "Afternoon";
            return "Evening";
          };
          const groupedTasks = ["Morning", "Afternoon", "Evening", "Anytime"]
            .map((group) => ({ group, tasks: previewTasks.filter((task) => timeBucket(task) === group) }))
            .filter((entry) => entry.tasks.length > 0);
          const completedForViewedDay = longHistoryByDate.get(dayViewDate) || new Set();
          const catchUpTasks = !isFuture && dayViewDate !== period.date
            ? previewTasks.filter((task) => !isTaskPausedOnDate(task, dayViewDate) && !completedForViewedDay.has(task.task_key))
            : [];
          return (
            <div style={{ marginBottom: 18, padding: 18, borderRadius: 20, background: "rgba(255,255,255,0.5)", border: "1px solid #E6D4F2", boxShadow: "0 8px 24px rgba(183,143,224,0.10)" }}>
              <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "#A65DC1", fontWeight: 800 }}>📆 DAY VIEW</div>
              <div style={{ marginTop: 4, fontSize: 11.5, color: "#8C6B9E" }}>Jump to any date — past days show what actually happened, future days show what's planned.</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                <button type="button" aria-label="Previous day" onClick={() => { const next = offsetDate(dayViewDate, -1); setDayViewDate(next); setSelectedProgressDate(next); setReflectionCalendarMonth(next.slice(0, 7)); if (next === period.date) setActive("daily"); }} style={{ padding: "6px 9px", borderRadius: 8, border: "1px solid #DCC9E8", background: "white", color: "#8E4EAA", cursor: "pointer" }}>←</button>
                <input type="date" value={dayViewDate} max={offsetDate(period.date, 365)} onChange={(event) => { const next = event.target.value || period.date; setDayViewDate(next); setSelectedProgressDate(next); setReflectionCalendarMonth(next.slice(0, 7)); if (next === period.date) setActive("daily"); }} style={{ padding: "6px 8px", borderRadius: 8, border: "1px solid #DCC9E8", fontSize: 12.5 }} />
                <button type="button" aria-label="Next day" onClick={() => { const next = offsetDate(dayViewDate, 1); setDayViewDate(next); setSelectedProgressDate(next); setReflectionCalendarMonth(next.slice(0, 7)); if (next === period.date) setActive("daily"); }} style={{ padding: "6px 9px", borderRadius: 8, border: "1px solid #DCC9E8", background: "white", color: "#8E4EAA", cursor: "pointer" }}>→</button>
                {dayViewDate !== period.date && <button type="button" onClick={() => { setDayViewDate(period.date); setSelectedProgressDate(period.date); setActive("daily"); }} style={{ padding: "6px 9px", borderRadius: 8, border: "1px solid #DCC9E8", background: "white", color: "#8E4EAA", fontWeight: 800, fontSize: 11, cursor: "pointer" }}>Today</button>}
              </div>
              <div style={{ marginTop: 10, fontSize: 14, fontWeight: 900, color: "#5B4B6B" }}>
                {new Date(`${dayViewDate}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                {isRestDay && !isFuture ? " · 🌴 Resting" : pct !== null ? ` · ${pct}% complete` : isFuture ? " · Planned" : ""}
              </div>
              {checkIn && <div style={{ marginTop: 6, fontSize: 12, color: "#8C6B9E" }}>{moodOption ? `Feeling ${moodOption[2]}` : ""}</div>}
              {catchUpTasks.length > 0 && <button type="button" onClick={() => markPastTasksDone(dayViewDate, catchUpTasks.map((task) => task.task_key))} style={{ marginTop: 10, width: "100%", padding: "9px 11px", borderRadius: 10, border: "1px solid #A9DCCD", background: "#F4FFF9", color: "#318C79", fontWeight: 900, fontSize: 12, cursor: "pointer" }}>✓ Catch up: mark {catchUpTasks.length} remaining {catchUpTasks.length === 1 ? "activity" : "activities"} as done</button>}
              {!dayViewExpanded ? (
                <button type="button" onClick={() => setDayViewExpanded(true)} style={{ marginTop: 12, width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: 10, border: "1px solid #E6D4F2", background: "white", color: "#5B4B6B", fontWeight: 800, fontSize: 12.5, cursor: "pointer" }}>
                  <span>📋 {previewTasks.length} {previewTasks.length === 1 ? "activity" : "activities"}</span>
                  <span style={{ color: "#A65DC1" }}>Show ›</span>
                </button>
              ) : (
              <>
              <button type="button" onClick={() => setDayViewExpanded(false)} style={{ marginTop: 12, marginBottom: 6, padding: "6px 10px", borderRadius: 8, border: "1px solid #E6D4F2", background: "white", color: "#8C6B9E", fontWeight: 700, fontSize: 11.5, cursor: "pointer" }}>▾ Collapse</button>
              <div style={{ marginTop: 4, display: "grid", gap: 10 }}>
                {groupedTasks.length === 0 ? (
                  <div style={{ fontSize: 11.5, color: "#8C6B9E" }}>Nothing scheduled for this day.</div>
                ) : groupedTasks.map(({ group, tasks }) => (
                  <div key={group}>
                    <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.08em", color: "#9A86A7", marginBottom: 4 }}>{group.toUpperCase()}</div>
                    <div style={{ display: "grid", gap: 5 }}>
                      {tasks.map((task) => {
                        const isToday = dayViewDate === period.date;
                        const isDone = !isFuture && (isToday ? !!done[task.task_key] : (longHistoryByDate.get(dayViewDate) || new Set()).has(task.task_key));
                        const paused = isTaskPausedOnDate(task, dayViewDate);
                        // Today's incomplete items stay unmarked - repeating "not
                        // done" beside every open task on the one day you can
                        // still act on is just noise. Past incomplete days get a
                        // quiet "Missed" label since there's nothing left to do
                        // about it; future ones say "Planned".
                        const label = paused ? "⏸ Paused" : isFuture ? "Planned" : isDone ? "✓ Done" : isToday ? "" : "Missed";
                        return (
                          <label key={task.task_key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "7px 10px", borderRadius: 9, background: "#FFFFFFAA", border: "1px solid #EADDE2", fontSize: 12, color: "#5B4B6B", cursor: isFuture || paused ? "default" : "pointer" }}>
                            <span style={{ display: "flex", alignItems: "center", gap: 7 }}>
                              {!isFuture && !paused && <input type="checkbox" checked={isDone} onChange={() => toggle(task.task_key, dayViewDate)} aria-label={`Mark ${task.task} done for ${dayViewDate}`} />}
                              <HabitTypeIcon task={task} />
                              {taskIsOptional(task) ? "⭐ " : ""}{task.task}
                            </span>
                            {label && <span style={{ fontSize: 10.5, fontWeight: 800, color: paused ? "#9A6918" : isDone ? "#318C79" : "#B0576B" }}>{label}</span>}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              </>
              )}
            </div>
          );
        })()}
        </div>

        {false && !isHistoricalView && habitTasks.length > 0 && (
          <div style={{ marginBottom: 18, padding: 16, borderRadius: 18, background: "#F2FFF8CC", border: "1px solid #BFE5D2" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.14em", fontWeight: 900, color: "#318C79" }}>🌱 HABIT GARDEN & REWARDS</div>
            <div style={{ marginTop: 5, fontSize: 12, lineHeight: 1.5, color: "#5E766F" }}>
              Habits you are building grow here, and habits you are breaking count as caring wins too. A reset never takes away a badge you already earned.
            </div>
            <div style={{ marginTop: 10, padding: "9px 10px", borderRadius: 11, background: "#FFFFFFB8", border: "1px solid #D7EEE2" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline", color: "#4D746A" }}><strong style={{ fontSize: 11.5 }}>Growing toward your next rewards</strong><strong style={{ fontSize: 13 }}>{habitGardenGrowthPct}%</strong></div>
              <div style={{ height: 7, marginTop: 6, overflow: "hidden", borderRadius: 99, background: "#E2F3EA" }}><div style={{ width: `${habitGardenGrowthPct}%`, height: "100%", borderRadius: 99, background: "linear-gradient(90deg,#4DD0B0,#4C8FE8)", transition: "width .4s ease" }} /></div>
              <div style={{ marginTop: 5, fontSize: 10.5, color: "#6B8A82" }}>{habitGardenTotalCheckIns} caring {habitGardenTotalCheckIns === 1 ? "check-in" : "check-ins"} across {habitTasks.length} {habitTasks.length === 1 ? "habit" : "habits"}.</div>
            </div>
            <button type="button" onClick={() => setHabitGardenOpen((open) => !open)} aria-expanded={habitGardenOpen} style={{ marginTop: 10, padding: "6px 9px", borderRadius: 8, border: "1px solid #A9DFC4", background: "white", color: "#318C79", fontWeight: 900, fontSize: 10.5, cursor: "pointer" }}>{habitGardenOpen ? "Hide garden details" : `View ${habitTasks.length} habits`}</button>
            {habitGardenOpen && <div style={{ display: "grid", gap: 8, marginTop: 11 }}>
              {habitTasks.map((habit) => {
                const nextCount = habit.stats.nextReward?.count;
                const progressPct = nextCount ? Math.min(100, Math.round((habit.stats.total / nextCount) * 100)) : 100;
                const remaining = nextCount ? Math.max(0, nextCount - habit.stats.total) : 0;
                return (
                <div key={habit.task_key} style={{ padding: "10px 11px", borderRadius: 12, background: "#FFFFFFB8", border: "1px solid #D7EEE2" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
                    <div style={{ fontSize: 13.5, fontWeight: 900, color: "#4F405C" }}>
                      {habit.habitType === "build" ? "🌱" : "🍂"} {habit.task}
                    </div>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ padding: "3px 7px", borderRadius: 999, background: habit.habitType === "build" ? "#EAF4FF" : "#FFF3E4", color: habit.habitType === "build" ? "#4C8FE8" : "#B4761D", fontSize: 9.5, fontWeight: 800 }}>
                        {habit.habitType === "build" ? "Building" : "Breaking"}
                      </span>
                      {habit.stats.current > 0 && (
                        <div title={`Best ever: ${habit.stats.best}`} style={{ padding: "4px 7px", borderRadius: 999, background: "#FFF3E4", color: "#B4761D", fontSize: 10.5, fontWeight: 900 }}>
                          🔥 {habit.stats.current}-day streak
                        </div>
                      )}
                      <div style={{ padding: "4px 7px", borderRadius: 999, background: "#E7F7EF", color: "#318C79", fontSize: 10.5, fontWeight: 900 }}>
                        {habit.stats.total} total
                      </div>
                    </div>
                  </div>
                  {habit.stats.best > 0 && (
                    <div style={{ marginTop: 4, fontSize: 10.5, color: "#8C6B9E" }}>
                      {habit.stats.current === habit.stats.best && habit.stats.current > 0
                        ? "🏆 This is your longest streak yet!"
                        : `Best streak: ${habit.stats.best} ${habit.stats.best === 1 ? "day" : "days"}`}
                    </div>
                  )}
                  {habit.stats.earnedReward && (
                    <div style={{ marginTop: 5, fontSize: 11.5, color: "#6B7E78" }}>
                      Earned: {habit.stats.earnedReward.badge} {habit.stats.earnedReward.label} · Every check-in keeps your progress
                    </div>
                  )}
                  {habit.stats.nextReward && (
                    <>
                      <div style={{ marginTop: 6, fontSize: 11.5, color: "#6B7E78" }}>
                        Next: {habit.stats.nextReward.badge} {habit.stats.nextReward.label} — {remaining === 0 ? "almost there!" : `${remaining} more ${remaining === 1 ? "check-in" : "check-ins"} to go`}
                      </div>
                      <div style={{ height: 6, background: "#E2F3EA", borderRadius: 4, marginTop: 5, overflow: "hidden" }}>
                        <div style={{ height: "100%", width: `${progressPct}%`, background: habit.habitType === "build" ? "#4C8FE8" : "#D4A017", borderRadius: 4, transition: "width .4s ease" }} />
                      </div>
                    </>
                  )}
                </div>
                );
              })}
            </div>}
          </div>
        )}

  </>
  );
}
