// Module split phase 7 (twelfth slice): the default "today" dashboard tab
// (dashboard === "today"), the last of the four dashboard-tab views and the
// biggest single phase-7 slice -- extracted the same way as CarePanel,
// ProgressPanel, and WeekPanel. Root is a JSX fragment (`<>...</>`), same as
// those three, not a single wrapped element.
//
// dayIdForDate/offsetDate/legacyScheduleToEntries/formatTime12 are read
// directly from window.PlushLifeSchedule (a UMD module); DAYS from
// window.PlushLifeContent -- matching every other phase-7 slice's pattern
// for these helpers rather than threading them through as props.
//
// FeatureTip is a small inline component defined inside GlowUpTracker
// itself (not a module export), so -- same as the existing RewardsPanel
// call site -- it's passed through as a prop rather than imported.
import { HabitTypeIcon } from "./shared.jsx";
import { BabyModeCareSuite } from "./baby-mode.jsx";
import { CalmPanel } from "./info-panels.jsx";

export function TodayPanel({ open, returnGapDays, returnBannerDismissed, setReturnBannerDismissed, voice, setEssentialsPickerOpen, selectDayType, wellbeingPatternInsight, todayDayId, hardDayBannerDismissed, setHardDayBannerDismissed, dailyCheckIn, restDatesSet, period, toggleRestToday, nextStepTask, nextStepReason, FeatureTip, day, babyMode, nextStepHint, toggle, pickEasierSuggestion, nextStepMoreOpen, setNextStepMoreOpen, setNextStepSkipped, setNextStepDismissedToday, weeklyIntentionEditing, setWeeklyIntentionEditing, weeklyIntentionDraft, setWeeklyIntentionDraft, weeklyIntentionText, saveWeeklyIntentionEdit, weeklyIntentionMessage, todayCardIndex, setTodayCardIndex, taskWeekDates, selectedProgressDate, selectTaskPreviewDate, isFutureView, selectedTaskDateLabel, todaySwipeStartX, todaySwipeStartY, selectedSchedule, selectedScheduleExceptionEntries, scheduleDayId, manageSchedule, setManageSchedule, active, rows, viewDone, openTaskManager, todayRequiredDone, todayRequiredKeys, activityDaysTotal, careDaysTotal, babyCaregiverName, trackerProfile, openJournalForSelectedDate, isHistoricalView, focusHelperOpen, setFocusHelperOpen, pickRandomFocusTask, setFocusSuggestionKey, focusedEssential, focusChoices, selectedTaskViewIsRest, pct, requiredDoneCount, requiredRows, preferences, doneCount, focusModeShowAll, setFocusModeShowAll, isTaskPausedOnDate, openRow, setOpenRow, celebrateKey, pauseTrackerTask, resumeTrackerTask, taskListCollapsed, setTaskListCollapsed, recentlyCompletedKeys, moveTaskGroup, startPointerTaskDrag, movePointerTaskDrag, endPointerTaskDrag, cancelPointerTaskDrag, moveTaskToTomorrow, completedTodayExpanded, setCompletedTodayExpanded, calmQuickOpen, setCalmQuickOpen, currentCopingOption, reshuffle, setCareSection, goToDashboard }) {
  if (!open) return null;
  const { dayIdForDate, offsetDate, legacyScheduleToEntries, formatTime12 } = window.PlushLifeSchedule;
  const { DAYS } = window.PlushLifeContent;
  return (
  <>
        {returnGapDays >= 2 && !returnBannerDismissed && (
          <div style={{ marginBottom: 18, padding: "15px 16px", borderRadius: 16, background: "#FFF9E9", border: "1px solid #F0D99E" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.14em", fontWeight: 900, color: "#A56D14" }}>🧸 WELCOME BACK</div>
                <div style={{ marginTop: 6, fontSize: 13.5, lineHeight: 1.5, color: "#6B5A3D" }}>
                  No catching up. We're only looking at today. {voice.welcomeBack(returnGapDays)}
                </div>
              </div>
              <button type="button" onClick={() => setReturnBannerDismissed(true)} aria-label="Dismiss welcome back message" style={{ padding: "4px 8px", borderRadius: 8, border: "1px solid #E4D7B4", background: "white", color: "#A56D14", fontWeight: 900, cursor: "pointer", flexShrink: 0 }}>✕</button>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              <button type="button" onClick={() => setReturnBannerDismissed(true)} style={{ padding: "7px 11px", borderRadius: 9, border: "1px solid #E4D7B4", background: "white", color: "#A56D14", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>Resume normally</button>
              <button type="button" onClick={() => { setEssentialsPickerOpen(true); setReturnBannerDismissed(true); }} style={{ padding: "7px 11px", borderRadius: 9, border: "1px solid #E4D7B4", background: "white", color: "#A56D14", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>Essentials only</button>
              <button type="button" onClick={() => { selectDayType("soft"); setReturnBannerDismissed(true); }} style={{ padding: "7px 11px", borderRadius: 9, border: "1px solid #E4D7B4", background: "white", color: "#A56D14", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>Lighter routine</button>
            </div>
          </div>
        )}

        {!(returnGapDays >= 2 && !returnBannerDismissed) && wellbeingPatternInsight && wellbeingPatternInsight.dayId === todayDayId && !hardDayBannerDismissed && (!dailyCheckIn.day_type || dailyCheckIn.day_type === "full") && (
          <div aria-live="polite" style={{ marginBottom: 18, padding: "15px 16px", borderRadius: 16, background: "#F3E8FA", border: "1px solid #E6D4F2" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div>
                <div style={{ fontSize: 11, letterSpacing: "0.14em", fontWeight: 900, color: "#8E4EAA" }}>♥ A GENTLE HEADS-UP</div>
                <div style={{ marginTop: 6, fontSize: 13.5, lineHeight: 1.5, color: "#6B5A7D" }}>{wellbeingPatternInsight.text}</div>
              </div>
              <button type="button" onClick={() => setHardDayBannerDismissed(true)} aria-label="Dismiss gentle heads-up" style={{ padding: "4px 8px", borderRadius: 8, border: "1px solid #D9B8E8", background: "white", color: "#8E4EAA", fontWeight: 900, cursor: "pointer", flexShrink: 0 }}>✕</button>
            </div>
            <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
              <button type="button" onClick={() => { selectDayType("soft"); setHardDayBannerDismissed(true); }} style={{ padding: "7px 11px", borderRadius: 9, border: "1px solid #D9B8E8", background: "white", color: "#8E4EAA", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>Start a Soft Day</button>
              <button type="button" onClick={() => setHardDayBannerDismissed(true)} style={{ padding: "7px 11px", borderRadius: 9, border: "1px solid #D9B8E8", background: "white", color: "#8E4EAA", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>I've got today, thanks</button>
            </div>
          </div>
        )}

        {restDatesSet.has(period.date) && (
          <div style={{ marginBottom: 18, padding: "13px 16px", borderRadius: 16, background: "#EAF6F1", border: "1px solid #A9DFC4", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.14em", fontWeight: 900, color: "#268A50" }}>🌴 RESTING TODAY</div>
              <div style={{ marginTop: 4, fontSize: 12.5, color: "#2F6E48" }}>Your task list and reminders are paused. Nothing is required today, and none of your progress is erased.</div>
            </div>
            <button type="button" onClick={toggleRestToday} style={{ padding: "6px 10px", borderRadius: 9, border: "1px solid #A9DFC4", background: "white", color: "#268A50", fontWeight: 800, fontSize: 11.5, cursor: "pointer", flexShrink: 0 }}>End rest day</button>
          </div>
        )}

        {nextStepTask && (() => {
          return (
            <>
            <FeatureTip id="one_next_step" text="This is your One Next Step — just the single most useful thing to do right now, so you don't have to look at everything at once." />
            <div data-plushlife-compact-card="next-step" style={{ marginBottom: 8, padding: "9px 11px", borderRadius: 13, background: day.accent + "10", border: "1px solid " + day.accent + "88" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 9.5, letterSpacing: "0.12em", fontWeight: 900, color: day.accent }}>{babyMode ? "🍼 ONE TINY THING" : "🎯 NEXT STEP"}</div>
                  <div style={{ marginTop: 2, fontSize: 15, lineHeight: 1.25, fontWeight: 850, color: "#5B4B6B", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nextStepTask.sourceTask && <HabitTypeIcon task={nextStepTask.sourceTask} />}{nextStepTask.label}</div>
                </div>
                <button type="button" onClick={() => toggle(nextStepTask.key)} style={{ minHeight: 34, padding: "6px 10px", borderRadius: 9, border: 0, background: day.accent, color: "white", fontWeight: 900, fontSize: 11.5, cursor: "pointer", flexShrink: 0 }}>✓ Done</button>
              </div>
              {nextStepReason && <div title={nextStepReason} style={{ marginTop: 3, fontSize: 10.5, lineHeight: 1.35, color: "#806B8D", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{nextStepReason}</div>}
              {nextStepHint?.key === nextStepTask.key && (
                <div style={{ marginTop: 6, padding: "7px 9px", borderRadius: 9, background: "white", fontSize: 11.5, color: "#6B5A7D" }}>
                  🌱 {nextStepHint.text}
                  <button type="button" onClick={() => toggle(nextStepTask.key)} style={{ display: "block", marginTop: 5, padding: "5px 8px", borderRadius: 8, border: "1px solid " + day.accent + "55", background: day.accent + "14", color: day.accent, fontWeight: 800, fontSize: 10.5, cursor: "pointer" }}>✓ Smaller version counts</button>
                </div>
              )}
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 6 }}>
                <button type="button" onClick={() => pickEasierSuggestion(nextStepTask.key)} style={{ minHeight: 32, padding: "5px 8px", borderRadius: 9, border: "1px solid " + day.accent + "55", background: "white", color: day.accent, fontWeight: 800, fontSize: 10.5, cursor: "pointer" }}>🌱 Make easier</button>
                <button type="button" onClick={() => setNextStepMoreOpen((open) => !open)} aria-expanded={nextStepMoreOpen} aria-label="More next-step choices" style={{ minWidth: 34, minHeight: 32, padding: "5px 8px", borderRadius: 9, border: "1px solid #D8C8E2", background: "white", color: "#8C6B9E", fontWeight: 900, fontSize: 11.5, cursor: "pointer" }}>•••</button>
              </div>
              {nextStepMoreOpen && <div style={{ display: "flex", gap: 5, marginTop: 6, flexWrap: "wrap" }}>
                <button type="button" onClick={() => { setNextStepSkipped((keys) => [...keys, nextStepTask.key]); setNextStepMoreOpen(false); }} style={{ padding: "6px 9px", borderRadius: 9, border: "1px solid " + day.accent + "55", background: "white", color: day.accent, fontWeight: 800, fontSize: 10.5, cursor: "pointer" }}>Pick another</button>
                <button type="button" onClick={() => { setNextStepDismissedToday(true); setNextStepMoreOpen(false); }} style={{ padding: "6px 9px", borderRadius: 9, border: "1px solid #D8C8E2", background: "white", color: "#8C6B9E", fontWeight: 700, fontSize: 10.5, cursor: "pointer" }}>Hide for today</button>
              </div>}
            </div>
            </>
          );
        })()}

        <div data-plushlife-compact-card="plushweek" style={{ marginBottom: 9, padding: "8px 10px", borderRadius: 13, background: "linear-gradient(135deg,#FBF3FE,#FFF9FD)", border: "1px solid #E3C9EC" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                <div style={{ fontSize: 9.5, letterSpacing: "0.12em", fontWeight: 900, color: "#A65DC1" }}>📮 PLUSHWEEK</div>
                {!weeklyIntentionEditing && <button type="button" onClick={() => { setWeeklyIntentionDraft(weeklyIntentionText); setWeeklyIntentionEditing(true); }} style={{ minHeight: 30, padding: "4px 6px", border: 0, background: "transparent", color: "#8E4EAA", fontWeight: 900, fontSize: 10.5, cursor: "pointer", flexShrink: 0 }}>{weeklyIntentionText ? "Edit" : "Add"}</button>}
              </div>
              {!weeklyIntentionEditing && <div style={{ marginTop: 1, fontSize: 12.5, lineHeight: 1.3, color: weeklyIntentionText ? "#5B4B6B" : "#9A86A7", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{weeklyIntentionText || "Set one gentle direction for this week"}</div>}
            </div>
          </div>
          {weeklyIntentionEditing && <>
            <div style={{ marginTop: 4, fontSize: 10.5, lineHeight: 1.35, color: "#806B8D", fontStyle: "italic" }}>What do I want to carry with me this week?</div>
            <textarea value={weeklyIntentionDraft} onChange={(event) => setWeeklyIntentionDraft(event.target.value)} maxLength={2000} placeholder="What do I want to carry with me this week?" style={{ width: "100%", boxSizing: "border-box", minHeight: 64, marginTop: 6, padding: 8, borderRadius: 9, border: "1px solid #D9B8E8", resize: "vertical" }} />
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}><button type="button" onClick={saveWeeklyIntentionEdit} style={{ padding: "6px 9px", borderRadius: 8, border: 0, background: "#A65DC1", color: "white", fontWeight: 900, cursor: "pointer" }}>Save</button><button type="button" onClick={() => setWeeklyIntentionEditing(false)} style={{ padding: "6px 9px", borderRadius: 8, border: "1px solid #D9B8E8", background: "white", color: "#8E4EAA", fontWeight: 800, cursor: "pointer" }}>Cancel</button></div>
            {weeklyIntentionMessage && <div style={{ marginTop: 5, fontSize: 10.5, color: "#8C6B9E" }}>{weeklyIntentionMessage}</div>}
          </>}
        </div>

        <div role="tablist" aria-label="Today view" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5, marginBottom: 9, padding: 4, borderRadius: 12, background: "#FFFFFF99", border: "1px solid #EADCEC" }}>
          <button role="tab" aria-selected={todayCardIndex === 0} type="button" onClick={() => setTodayCardIndex(0)} style={{ padding: "8px 10px", borderRadius: 9, border: 0, background: todayCardIndex === 0 ? `${day.accent}22` : "transparent", color: todayCardIndex === 0 ? day.accent : "#8C6B9E", fontWeight: 900, fontSize: 12, cursor: "pointer" }}>🗓 Schedule</button>
          <button role="tab" aria-selected={todayCardIndex === 1} type="button" onClick={() => setTodayCardIndex(1)} style={{ padding: "8px 10px", borderRadius: 9, border: 0, background: todayCardIndex === 1 ? `${day.accent}22` : "transparent", color: todayCardIndex === 1 ? day.accent : "#8C6B9E", fontWeight: 900, fontSize: 12, cursor: "pointer" }}>{babyMode ? "🧸 Little Jobs" : "✓ Tasks"}</button>
        </div>
        {todayCardIndex === 1 && (
          <>
            <div role="tablist" aria-label="Task week" style={{ display: "grid", gridTemplateColumns: "repeat(7,minmax(0,1fr))", gap: 4, marginBottom: 9, padding: 5, borderRadius: 13, background: "rgba(255,255,255,.72)", border: "1px solid #EADCEC" }}>
              {taskWeekDates.map((date) => {
                const selected = selectedProgressDate === date;
                const isTodayDate = date === period.date;
                const isUpcomingDate = date > period.date;
                const dateValue = new Date(`${date}T12:00:00Z`);
                const shortDay = dateValue.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }).slice(0, 2);
                const dayNumber = dateValue.toLocaleDateString("en-US", { day: "numeric", timeZone: "UTC" });
                const fullDay = dateValue.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
                return (
                  <button key={date} role="tab" aria-selected={selected} type="button" onClick={() => selectTaskPreviewDate(date)} title={`${fullDay}${isTodayDate ? " · Today" : isUpcomingDate ? " · Preview" : ""}`} style={{ minWidth: 0, minHeight: 48, padding: "5px 2px", borderRadius: 9, border: selected ? `2px solid ${day.accent}` : "1px solid transparent", background: selected ? `${day.accent}18` : "transparent", color: selected ? day.accent : "#806B8D", cursor: "pointer", display: "grid", placeItems: "center", alignContent: "center", gap: 1, position: "relative" }}>
                    <span style={{ fontSize: 9.5, fontWeight: 900, letterSpacing: ".04em", textTransform: "uppercase" }}>{shortDay}</span>
                    <span style={{ fontSize: 12, fontWeight: 900, lineHeight: 1 }}>{dayNumber}</span>
                    {isTodayDate && <span aria-hidden="true" style={{ position: "absolute", bottom: 2, fontSize: 9, lineHeight: 1, color: day.accent }}>●</span>}
                  </button>
                );
              })}
            </div>
            {isFutureView && (
              <div style={{ margin: "-1px 0 10px", padding: "8px 10px", borderRadius: 11, background: "#F7F2FB", border: "1px solid #E6D4F2", color: "#765F84", fontSize: 11.5, lineHeight: 1.4 }}>
                <strong>{selectedTaskDateLabel} preview</strong> · You can see what is coming up now. Checkboxes unlock when that day arrives.
              </div>
            )}
          </>
        )}
        <div
          onTouchStart={(event) => { event.stopPropagation(); todaySwipeStartX.current = event.touches[0]?.clientX ?? null; todaySwipeStartY.current = event.touches[0]?.clientY ?? null; }}
          onTouchEnd={(event) => {
            event.stopPropagation();
            const startX = todaySwipeStartX.current;
            const startY = todaySwipeStartY.current;
            const endX = event.changedTouches[0]?.clientX;
            const endY = event.changedTouches[0]?.clientY;
            todaySwipeStartX.current = null;
            todaySwipeStartY.current = null;
            if (startX == null || endX == null || startY == null || endY == null) return;
            const deltaX = endX - startX;
            const deltaY = endY - startY;
            if (Math.abs(deltaX) < 45 || Math.abs(deltaX) < Math.abs(deltaY) * 1.5) return;
            setTodayCardIndex(deltaX < 0 ? 1 : 0);
          }}
          style={{ touchAction: "pan-y" }}>
        {todayCardIndex === 0 && <>
        {/* Personal schedule */}
        {selectedSchedule || selectedScheduleExceptionEntries.length > 0 ? (
        <div style={{ marginBottom: 14, padding: 14, borderRadius: 16, background: "rgba(255,255,255,0.58)", border: `1px solid ${day.accent}44` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            <div style={{ fontSize: 11, letterSpacing: "0.18em", color: day.accent, fontWeight: 800 }}>🗓️ {(selectedSchedule?.label || DAYS.find((item) => item.id === scheduleDayId)?.title || "TODAY").toUpperCase()} SCHEDULE</div>
            <button type="button" onClick={() => setManageSchedule((open) => !open)} style={{ padding: "7px 10px", borderRadius: 9, border: "1px solid #4C8FE855", background: manageSchedule ? "#EAF4FF" : "#FFFFFFAA", color: "#4C8FE8", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>
              🗓️ {manageSchedule ? "Done changing schedule" : "Change schedule"}
            </button>
          </div>
          {(() => {
            const baseEntries = selectedSchedule?.entries?.length
              ? selectedSchedule.entries
              : legacyScheduleToEntries(selectedSchedule);
            const displayEntries = [...baseEntries, ...selectedScheduleExceptionEntries].sort((a, b) => String(a.time || "99:99").localeCompare(String(b.time || "99:99")));
            return displayEntries.length > 0 ? (
          <div style={{ display: "grid", gap: 5, marginTop: 10 }}>
                {displayEntries.map((entry, index) => (
                  <div key={index} style={{ display: "grid", gridTemplateColumns: entry.time ? "70px 1fr" : "1fr", alignItems: "center", gap: 7, padding: "8px 9px", borderRadius: 9, background: entry.isException ? "#EEF9F5" : "#FFFFFF99", border: entry.isException ? "1px solid #B9E0D0" : "1px solid #EFE3F3" }}>
                    {entry.time && <span style={{ fontSize: 13, color: day.accent, fontWeight: 900 }}>{formatTime12(entry.time)}</span>}
                    <span style={{ fontSize: 12.5, lineHeight: 1.35, color: "#5B4B6B", fontWeight: 600 }}>{entry.isException && <span style={{ marginRight: 5, color: "#318C79", fontSize: 10, fontWeight: 900 }}>EXTRA</span>}{entry.text}</span>
                  </div>
                ))}
              </div>
            ) : null;
          })()}
          {active === "daily" && (
            <div style={{ marginTop: 9, fontSize: 11.5, color: "#8C6B9E" }}>
              DAILY follows today's schedule. Tap a day above to preview another day. 💛
            </div>
          )}
        </div>
        ) : (
        <div style={{ marginBottom: 18, padding: 18, borderRadius: 20, background: "rgba(255,255,255,0.5)", border: "1px dashed #C9B3DC", textAlign: "center" }}>
          <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "#8C6B9E", fontWeight: 800 }}>🗓️ NO SCHEDULE YET</div>
          <div style={{ marginTop: 6, fontSize: 12.5, lineHeight: 1.5, color: "#6B5A7D" }}>
            You haven't set a wake-up time or schedule for {active === "daily" ? "today" : (DAYS.find((item) => item.id === scheduleDayId)?.label || scheduleDayId.toUpperCase())} yet.
          </div>
          <button type="button" onClick={() => setManageSchedule(true)} style={{ marginTop: 10, padding: "9px 14px", borderRadius: 10, border: 0, background: "#A65DC1", color: "white", fontWeight: 900, cursor: "pointer" }}>
            🗓️ Add a schedule
          </button>
        </div>
        )}
        {dailyCheckIn.day_type !== "rest" && !babyMode && (() => {
          // A small glance at what still needs doing, so leading with the
          // schedule doesn't mean losing sight of today's tasks entirely.
          const habitRowsToday = rows.filter((r) => r.habitType !== "regular");
          const previewHabits = habitRowsToday.filter((r) => !viewDone[r.key]).slice(0, 3);
          if (habitRowsToday.length === 0) return null;
          return (
            <div style={{ marginTop: 14, padding: 14, borderRadius: 16, background: "rgba(255,255,255,0.58)", border: "1px solid #E6D4F2" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <div style={{ fontSize: 11, letterSpacing: "0.18em", color: day.accent, fontWeight: 800 }}>🌱 HABITS TODAY</div>
                <button type="button" onClick={() => openTaskManager(dayIdForDate(period.date))} style={{ padding: "5px 9px", borderRadius: 8, border: `1px solid ${day.accent}55`, background: "white", color: day.accent, fontWeight: 900, fontSize: 11, cursor: "pointer" }}>Manage habits ({habitRowsToday.length}) →</button>
              </div>
              <div style={{ display: "grid", gap: 5 }}>
                {previewHabits.length > 0 ? previewHabits.map((r) => (
                  <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 9px", borderRadius: 9, background: "#FFFFFF99", border: "1px solid #F3D9EC", opacity: isFutureView ? 0.62 : 1 }}>
                    <span onClick={() => { if (!isFutureView) toggle(r.key); }}
                      role="checkbox" aria-checked={false} aria-label={r.label} tabIndex={isFutureView ? -1 : 0}
                      onKeyDown={(e) => { if (isFutureView) return; if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(r.key); } }}
                      style={{ width: 18, height: 18, minWidth: 18, borderRadius: 6, border: "2px solid #E3B8D8", cursor: isFutureView ? "not-allowed" : "pointer" }} />
                    <span style={{ fontSize: 13, color: "#5B4B6B", fontWeight: 500 }}>
                      {r.sourceTask && <HabitTypeIcon task={r.sourceTask} />}
                      {r.label}
                    </span>
                  </div>
                )) : (
                  <div style={{ padding: "9px 10px", borderRadius: 9, background: "#FFFFFF99", border: "1px solid #D7EEE2", fontSize: 12.5, color: "#318C79", fontWeight: 800 }}>All of today's habits are checked in. ✨</div>
                )}
              </div>
            </div>
          );
        })()}
        </>}

        {todayCardIndex === 1 && babyMode && !isFutureView && !isHistoricalView && dailyCheckIn.day_type !== "rest" && (
          <BabyModeCareSuite
            date={period.date}
            todayDone={todayRequiredDone}
            todayTotal={todayRequiredKeys.length}
            activityDays={activityDaysTotal}
            careDays={careDaysTotal}
            caregiverName={babyCaregiverName}
            comfortItemName={trackerProfile?.comfort_item_name?.trim() || ""}
            littleJobs={rows.filter((row) => !viewDone[row.key])}
            onCompleteTask={(taskKey) => toggle(taskKey)}
            onManageTasks={() => openTaskManager(dayIdForDate(period.date))}
            onOpenJournal={openJournalForSelectedDate}
          />
        )}

        {todayCardIndex === 1 && !babyMode && !isFutureView && rows.length > 0 && dailyCheckIn.day_type !== "rest" && (focusHelperOpen || !nextStepTask) && (
          // Suppressed (unless already open) whenever the One Next Step card
          // above is already showing this same single-task suggestion — no
          // point offering "pick one thing for me" right under a card that's
          // already doing exactly that.
          <div style={{ marginBottom: 14, padding: 15, borderRadius: 18, background: focusHelperOpen ? "#F2FFFB" : "#FFFFFF99", border: focusHelperOpen ? "1px solid #73B7A8" : "1px solid #CFE8E1" }}>
            {!focusHelperOpen ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 900, color: "#318C79" }}>Feeling stuck or overwhelmed?</div>
                  <div style={{ marginTop: 3, fontSize: 11.5, color: "#6B5A7D" }}>{isHistoricalView ? "I can gently choose one required task from this day." : "I can gently choose one required task for today."}</div>
                </div>
                <button type="button" onClick={pickRandomFocusTask} style={{ padding: "8px 11px", borderRadius: 10, border: 0, background: "#318C79", color: "white", fontWeight: 900, cursor: "pointer" }}>🧸 Pick one thing for me</button>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ fontSize: 11, letterSpacing: "0.12em", fontWeight: 900, color: "#318C79" }}>🧸 JUST ONE LITTLE STEP</div>
                  <button type="button" onClick={() => { setFocusHelperOpen(false); setFocusSuggestionKey(null); }} aria-label="Close one-step helper" style={{ padding: "4px 7px", borderRadius: 8, border: "1px solid #B9DDD4", background: "white", color: "#318C79", fontWeight: 900, cursor: "pointer" }}>Close</button>
                </div>
                {focusedEssential ? (
                  <>
                    <div style={{ marginTop: 9, fontSize: 17, fontWeight: 900, color: "#4F405C" }}>{focusedEssential.sourceTask && <HabitTypeIcon task={focusedEssential.sourceTask} />}{focusedEssential.label}</div>
                    {focusedEssential.how && <div style={{ marginTop: 5, fontSize: 12, lineHeight: 1.5, color: "#6B5A7D" }}>{focusedEssential.how}</div>}
                    {focusedEssential.why && <div style={{ marginTop: 5, fontSize: 12.5, lineHeight: 1.5, fontStyle: "italic", color: "#318C79" }}>💛 Why: {focusedEssential.why}</div>}
                    <div style={{ marginTop: 10, display: "flex", gap: 7, flexWrap: "wrap" }}>
                      <button type="button" onClick={() => { toggle(focusedEssential.key, selectedProgressDate); setFocusHelperOpen(false); setFocusSuggestionKey(null); }} style={{ padding: "8px 11px", borderRadius: 10, border: 0, background: "#318C79", color: "white", fontWeight: 900, cursor: "pointer" }}>Mark this done ✓</button>
                      {focusChoices.length > 1 && <button type="button" onClick={pickRandomFocusTask} style={{ padding: "8px 11px", borderRadius: 10, border: "1px solid #73B7A8", background: "white", color: "#318C79", fontWeight: 900, cursor: "pointer" }}>Pick a different one</button>}
                    </div>
                    <div style={{ marginTop: 8, fontSize: 11, color: "#6B8A82" }}>Nothing is marked done until you tap the green button.</div>
                  </>
                ) : (
                  <div style={{ marginTop: 9, fontSize: 13.5, color: "#318C79", fontWeight: 900 }}>All required tasks here are finished. You did it! ✨</div>
                )}
              </div>
            )}
          </div>
        )}
        {todayCardIndex === 1 && rows.length > 0 && (!babyMode || isFutureView || isHistoricalView || selectedTaskViewIsRest) && (
          <div style={{ marginBottom: 14, padding: 14, borderRadius: 16, background: "rgba(255,255,255,0.58)", border: "1px solid #E6D4F2" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <div style={{ fontSize: 11, letterSpacing: "0.18em", color: day.accent, fontWeight: 800 }}>{selectedTaskViewIsRest ? "REST DAY" : isFutureView ? `${selectedTaskDateLabel.toUpperCase()} TASKS` : isHistoricalView ? `${selectedTaskDateLabel.toUpperCase()} HISTORY` : "TODAY'S TASKS"}</div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 7, flexWrap: "wrap" }}>
                <span style={{ fontSize: 13, color: day.accent, fontWeight: 700 }}>{selectedTaskViewIsRest ? "NO TASKS REQUIRED" : `${pct}% · ${requiredDoneCount}/${requiredRows.length}`}</span>
                {!isHistoricalView && <button type="button" onClick={() => openTaskManager(dayIdForDate(period.date))} style={{ padding: "6px 9px", borderRadius: 8, border: `1px solid ${day.accent}55`, background: "white", color: day.accent, fontWeight: 900, fontSize: 11, cursor: "pointer" }}>✏️ Edit tasks</button>}
              </div>
            </div>
            {!selectedTaskViewIsRest && <div style={{ height: 8, background: "rgba(255,255,255,0.4)", borderRadius: 6, margin: "8px 0 11px", overflow: "hidden", border: "1px solid #F3D9EC" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: day.accent, borderRadius: 6, transition: "width .4s cubic-bezier(.34,1.56,.64,1)" }} />
            </div>}
            {!selectedTaskViewIsRest && preferences.nurturing_checkins && (
              <div style={{ marginBottom: 10, fontSize: 13, lineHeight: 1.5, fontWeight: 700, color: "#7D668C" }}>
                {doneCount > 0 ? voice.nurturingSome(doneCount) : voice.nurturingNone}
              </div>
            )}
            {selectedTaskViewIsRest ? (
              <div style={{ padding: "22px 14px", borderRadius: 16, background: "#EAF6F1", border: "1px solid #A9DFC4", textAlign: "center", color: "#2F6E48" }}>
                <div style={{ fontSize: 26 }}>🌴</div>
                <div style={{ marginTop: 6, fontWeight: 900, fontSize: 15 }}>Your list is resting too.</div>
                <div style={{ marginTop: 4, fontSize: 12.5, lineHeight: 1.5 }}>Nothing is overdue, no backlog is created, and anything you choose to do is simply a bonus.</div>
              </div>
            ) : preferences.focus_mode && !focusModeShowAll ? (() => {
              const isPickable = (r) => !viewDone[r.key] && !(r.sourceTask && isTaskPausedOnDate(r.sourceTask, period.date));
              const focusNextTask = rows.find((r) => !r.isBonus && isPickable(r)) || rows.find(isPickable);
              if (!focusNextTask) {
                return (
                  <div style={{ textAlign: "center", padding: "18px 0 2px", color: day.accent, fontWeight: 800, fontSize: 15 }}>Everything's done — proud of you 💜</div>
                );
              }
              const checked = !!viewDone[focusNextTask.key];
              const expandable = !!(focusNextTask.how || focusNextTask.why);
              const expanded = openRow === focusNextTask.key;
              return (
                <div>
                  <div style={{ fontSize: 10.5, letterSpacing: "0.14em", color: day.accent, fontWeight: 800, marginBottom: 6 }}>🎯 NEXT UP{focusNextTask.section ? ` · ${focusNextTask.section.toUpperCase()}` : ""}</div>
                  <div style={{ borderRadius: 18, border: `2px solid ${day.accent}`, background: day.accent + "14", overflow: "hidden" }}>
                    <div onClick={() => { if (isFutureView) return; expandable ? setOpenRow(expanded ? null : focusNextTask.key) : toggle(focusNextTask.key); }}
                      role={expandable ? "button" : undefined}
                      aria-expanded={expandable ? expanded : undefined}
                      aria-label={expandable ? `${expanded ? "Hide" : "Show"} details for ${focusNextTask.label}` : undefined}
                      tabIndex={expandable && !isFutureView ? 0 : undefined}
                      onKeyDown={expandable ? (e) => {
                        if (isFutureView) return;
                        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpenRow(expanded ? null : focusNextTask.key); }
                      } : undefined}
                      style={{ display: "flex", alignItems: "center", gap: 16, padding: "22px 18px", cursor: isFutureView ? "not-allowed" : "pointer" }}>
                      <button type="button" onClick={(e) => { e.stopPropagation(); if (!isFutureView) toggle(focusNextTask.key); }}
                        disabled={isFutureView} aria-pressed={checked} aria-label={`${checked ? "Mark incomplete" : "Mark complete"}: ${focusNextTask.label}`}
                        style={{ width: 40, height: 40, minWidth: 40, borderRadius: 12,
                          border: `3px solid ${day.accent}`,
                          background: checked ? day.accent : "white",
                          display: "flex", alignItems: "center", justifyContent: "center", padding: 0, cursor: isFutureView ? "not-allowed" : "pointer",
                          color: "white", fontWeight: 900, fontSize: 22, animation: celebrateKey === focusNextTask.key ? "checkPop 0.5s ease" : "none" }}>
                        {checked ? "✓" : ""}
                      </button>
                      <span style={{ flex: 1, fontSize: 19, fontWeight: 700, color: "#5B4B6B" }}>{focusNextTask.sourceTask && <HabitTypeIcon task={focusNextTask.sourceTask} />}{focusNextTask.label}</span>
                      {focusNextTask.sourceTask && !isFutureView && (
                        <button
                          type="button"
                          onClick={(event) => { event.stopPropagation(); pauseTrackerTask(focusNextTask.sourceTask.task_key); }}
                          aria-label={`Pause ${focusNextTask.label}`}
                          title="Pause"
                          style={{ flexShrink: 0, width: 32, height: 32, borderRadius: 10, border: "none", background: "transparent", color: "#C9B8D4", fontSize: 16, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                        >
                          ⏸
                        </button>
                      )}
                    </div>
                    {expandable && expanded && (
                      <div style={{ padding: "0 18px 16px 74px", fontSize: 14, lineHeight: 1.6, color: "#6B5A7D" }}>
                        {focusNextTask.how && <div>{focusNextTask.how}</div>}
                        {focusNextTask.why && <div style={{ marginTop: focusNextTask.how ? 6 : 0, fontStyle: "italic", color: day.accent }}>💛 Why: {focusNextTask.why}</div>}
                      </div>
                    )}
                  </div>
                </div>
              );
            })() : taskListCollapsed ? (() => {
              const pendingRows = rows.filter((r) => !viewDone[r.key] && !(r.sourceTask && isTaskPausedOnDate(r.sourceTask, period.date)));
              const requiredPendingRows = pendingRows.filter((r) => !r.isBonus);
              const bonusPendingCount = pendingRows.length - requiredPendingRows.length;
              const previewRows = (requiredPendingRows.length ? requiredPendingRows : pendingRows).slice(0, 3);
              const pendingCount = requiredPendingRows.length;
              return (
                <button type="button" onClick={() => setTaskListCollapsed(false)} style={{ width: "100%", display: "block", padding: "13px 14px", borderRadius: 13, border: `1px solid ${day.accent}55`, background: "white", cursor: "pointer", textAlign: "left" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <span style={{ fontWeight: 900, fontSize: 13.5, color: "#5B4B6B" }}>📋 {pendingCount ? `${pendingCount} required task${pendingCount === 1 ? "" : "s"} still waiting` : bonusPendingCount ? "Required tasks are done" : "Today's tasks"}</span>
                    <span style={{ fontWeight: 900, fontSize: 12.5, color: day.accent, whiteSpace: "nowrap" }}>See full list ›</span>
                  </div>
                  {previewRows.length > 0 && <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
                    {previewRows.map((r) => <div key={r.key} style={{ fontSize: 12, color: "#6B5A7D", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>○ {r.sourceTask && <HabitTypeIcon task={r.sourceTask} />}{r.label}</div>)}
                  </div>}
                  {bonusPendingCount > 0 && <div style={{ marginTop: 6, fontSize: 10.5, color: "#927C9E" }}>{bonusPendingCount} optional bonus {bonusPendingCount === 1 ? "task" : "tasks"} available</div>}
                </button>
              );
            })() : (
              <>
                <button type="button" onClick={() => setTaskListCollapsed(true)} style={{ marginBottom: 10, padding: "7px 11px", borderRadius: 9, border: "1px solid #E6D4F2", background: "white", color: "#8C6B9E", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>▾ Collapse list</button>
                {preferences.focus_mode && (
                  <button type="button" onClick={() => setFocusModeShowAll(false)} style={{ marginBottom: 10, marginLeft: 8, padding: "7px 11px", borderRadius: 9, border: "1px solid #E6D4F2", background: "white", color: "#8C6B9E", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>🎯 Back to one thing at a time</button>
                )}
                {(() => {
              let lastSection = "";
              const lowCapacityRows = rows.filter((r) => !r.isBonus && r.sourceTask?.essential_on_low_capacity);
              const visibleRows = dailyCheckIn.day_type === "rest"
                ? []
                : dailyCheckIn.custom_essentials?.length
                  ? rows.filter((r) => dailyCheckIn.custom_essentials.includes(r.key))
                : dailyCheckIn.day_type === "tiny"
                  ? (lowCapacityRows.length ? lowCapacityRows : rows.filter((r) => !r.isBonus).slice(0, 3))
                : dailyCheckIn.day_type === "recovery"
                  ? (lowCapacityRows.length ? lowCapacityRows : rows.filter((r) => !r.isBonus).slice(0, 5))
                  : dailyCheckIn.soft_day || dailyCheckIn.day_type === "soft"
                    ? rows.filter((r) => !r.isBonus)
                    : rows;
              const visibleGroupOrder = Array.from(new Set(visibleRows.map((row) => row.section).filter(Boolean)));
              const incompleteRows = visibleRows.filter((r) => !viewDone[r.key] || recentlyCompletedKeys.includes(r.key));
              const completedRows = visibleRows.filter((r) => viewDone[r.key] && !recentlyCompletedKeys.includes(r.key));
              const renderRow = (r) => {
                const groupKey = r.isEveryday ? "__everyday__" : r.section;
                const header = groupKey !== lastSection ? (r.isEveryday ? "Daily" : r.section) : null;
                lastSection = groupKey;
                const checked = !!viewDone[r.key];
                const isMovable = r.sourceTask?.schedule_type === "once" && !checked && !isFutureView;
                const expandable = !!(r.how || r.why) || isMovable;
                const expanded = openRow === r.key;
                const draggableTodayTask = !!r.sourceTask && !checked && !isFutureView && !isHistoricalView;
                return (
                  <div key={r.key}>
                    {header && (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, margin: "12px 2px 6px", userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" }}>
                        <span style={{ fontSize: 11, letterSpacing: "0.18em", color: day.accent, fontWeight: 700 }}>{header.toUpperCase()}</span>
                        {!isFutureView && !isHistoricalView && visibleGroupOrder.length > 1 && (
                          <span style={{ display: "flex", gap: 3 }}>
                            <button type="button" disabled={visibleGroupOrder.indexOf(r.section) === 0} onClick={() => moveTaskGroup(r.section, -1, visibleGroupOrder)} aria-label={`Move ${header} group earlier`} title="Move group earlier" style={{ width: 26, height: 26, minHeight: 26, padding: 0, borderRadius: 8, border: "1px solid #E7D2E8", background: "rgba(255,255,255,.55)", color: day.accent, opacity: visibleGroupOrder.indexOf(r.section) === 0 ? .3 : 1, fontWeight: 900, cursor: visibleGroupOrder.indexOf(r.section) === 0 ? "default" : "pointer" }}>↑</button>
                            <button type="button" disabled={visibleGroupOrder.indexOf(r.section) === visibleGroupOrder.length - 1} onClick={() => moveTaskGroup(r.section, 1, visibleGroupOrder)} aria-label={`Move ${header} group later`} title="Move group later" style={{ width: 26, height: 26, minHeight: 26, padding: 0, borderRadius: 8, border: "1px solid #E7D2E8", background: "rgba(255,255,255,.55)", color: day.accent, opacity: visibleGroupOrder.indexOf(r.section) === visibleGroupOrder.length - 1 ? .3 : 1, fontWeight: 900, cursor: visibleGroupOrder.indexOf(r.section) === visibleGroupOrder.length - 1 ? "default" : "pointer" }}>↓</button>
                          </span>
                        )}
                      </div>
                    )}
                    <div
                      data-plushlife-task-drop-key={draggableTodayTask ? r.sourceTask.task_key : undefined}
                      data-plushlife-task-drop-label={draggableTodayTask ? r.label : undefined}
                      data-plushlife-task-drop-section={draggableTodayTask ? r.sourceTask.section : undefined}
                      style={{ marginBottom: 6, borderRadius: 12,
                      border: "1px solid " + (checked ? day.accent + "66" : "#F3D9EC"),
                      background: checked ? day.accent + "1A" : "rgba(255,255,255,0.25)",
                      overflow: "hidden", userSelect: draggableTodayTask ? "none" : undefined, WebkitUserSelect: draggableTodayTask ? "none" : undefined, WebkitTouchCallout: draggableTodayTask ? "none" : undefined, transition: "transform .12s ease, box-shadow .12s ease" }}>
                      <div onClick={() => { if (isFutureView) return; expandable ? setOpenRow(expanded ? null : r.key) : toggle(r.key); }}
                        role={expandable ? "button" : undefined}
                        aria-expanded={expandable ? expanded : undefined}
                        aria-label={expandable ? `${expanded ? "Hide" : "Show"} details for ${r.label}` : undefined}
                        tabIndex={expandable && !isFutureView ? 0 : undefined}
                        onKeyDown={expandable ? (e) => {
                          if (isFutureView) return;
                          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpenRow(expanded ? null : r.key); }
                        } : undefined}
                        style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 12px", cursor: isFutureView ? "not-allowed" : "pointer", opacity: isFutureView ? 0.62 : 1 }}>
                        {draggableTodayTask && <button
                          type="button"
                          draggable={false}
                          aria-label={`Reorder ${r.label}`}
                          title="Drag to move"
                          onClick={(event) => { event.preventDefault(); event.stopPropagation(); }}
                          onPointerDown={(event) => startPointerTaskDrag(event, r.sourceTask.task_key, r.label)}
                          onPointerMove={movePointerTaskDrag}
                          onPointerUp={endPointerTaskDrag}
                          onPointerCancel={cancelPointerTaskDrag}
                          onContextMenu={(event) => event.preventDefault()}
                          onSelect={(event) => event.preventDefault()}
                          style={{ flex: "0 0 auto", width: 28, height: 32, minHeight: 32, padding: 0, borderRadius: 8, border: "1px solid #E7D2E8", background: "rgba(255,255,255,.42)", color: "#9A86A7", fontSize: 14, fontWeight: 900, lineHeight: 1, cursor: "grab", touchAction: "none", userSelect: "none", WebkitUserSelect: "none", WebkitTouchCallout: "none" }}
                        >⋮⋮</button>}
                        <span onClick={(e) => { e.stopPropagation(); if (!isFutureView) toggle(r.key); }}
                          role="checkbox"
                          aria-checked={checked}
                          aria-label={r.label}
                          tabIndex={isFutureView ? -1 : 0}
                          onKeyDown={(e) => {
                            if (isFutureView) return;
                            if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); toggle(r.key); }
                          }}
                          style={{ width: 22, height: 22, minWidth: 22, borderRadius: 7,
                            border: `2px solid ${checked ? day.accent : "#E3B8D8"}`,
                            background: checked ? day.accent : "transparent",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            color: "#FFF6FB", fontWeight: 900, fontSize: 12, animation: celebrateKey === r.key ? "checkPop 0.5s ease" : "none" }}>
                          {checked ? "✓" : ""}
                        </span>
                        <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: checked ? "#B08AC7" : "#5B4B6B", textDecoration: checked ? "line-through" : "none" }}>
                          {r.sourceTask && <HabitTypeIcon task={r.sourceTask} />}
                          {r.label}
                          {r.sourceTask && isTaskPausedOnDate(r.sourceTask, period.date) && <span style={{ marginLeft: 6, padding: "1px 6px", borderRadius: 999, background: "#FFFBF2", color: "#A56D14", fontSize: 9.5, fontWeight: 900, textDecoration: "none" }}>PAUSED</span>}
                          {r.label !== r.originalLabel && <span style={{ display: "block", marginTop: 2, fontSize: 10.5, color: "#9A86A7", textDecoration: "none" }}>{r.dayType === "tiny" ? "Tiny" : r.dayType === "recovery" ? "Recovery" : "Soft"} version of {r.originalLabel}</span>}
                        </span>
                        {r.right && <span style={{ fontSize: 12.5, color: "#B08AC7", whiteSpace: "nowrap" }}>{r.right}</span>}
                        {r.sourceTask && !isFutureView && (
                          <button
                            type="button"
                            onClick={(event) => { event.stopPropagation(); isTaskPausedOnDate(r.sourceTask, period.date) ? resumeTrackerTask(r.sourceTask.task_key) : pauseTrackerTask(r.sourceTask.task_key); }}
                            aria-label={isTaskPausedOnDate(r.sourceTask, period.date) ? `Resume ${r.label}` : `Pause ${r.label}`}
                            title={isTaskPausedOnDate(r.sourceTask, period.date) ? "Resume" : "Pause"}
                            style={{ flexShrink: 0, width: 26, height: 26, borderRadius: 8, border: "none", background: "transparent", color: isTaskPausedOnDate(r.sourceTask, period.date) ? "#318C79" : "#C9B8D4", fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
                          >
                            {isTaskPausedOnDate(r.sourceTask, period.date) ? "▶️" : "⏸"}
                          </button>
                        )}
                        {expandable && <span style={{ color: day.accent, fontSize: 11, transform: expanded ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▾</span>}
                      </div>
                      {expandable && expanded && (
                        <div style={{ padding: "0 14px 12px 46px", fontSize: 13, lineHeight: 1.6, color: "#6B5A7D" }}>
                          {r.how && <div>{r.how}</div>}
                          {r.why && <div style={{ marginTop: r.how ? 6 : 0, fontStyle: "italic", color: day.accent }}>💛 Why: {r.why}</div>}
                          {isMovable && (
                            <button type="button" onClick={(event) => { event.stopPropagation(); moveTaskToTomorrow(r.key, period.date); setOpenRow(null); }} style={{ marginTop: r.how || r.why ? 8 : 0, padding: "6px 10px", borderRadius: 8, border: `1px solid ${day.accent}55`, background: "white", color: day.accent, fontWeight: 800, fontSize: 11.5, cursor: "pointer" }}>📅 Move to tomorrow</button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              };
              return (
                <div data-plushlife-task-drag-scope>
                  {incompleteRows.map(renderRow)}
                  {completedRows.length > 0 && (
                    <div style={{ marginTop: 10 }}>
                      <button type="button" onClick={() => setCompletedTodayExpanded((open) => !open)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 10px", borderRadius: 10, border: "1px solid #E6D4F2", background: "rgba(255,255,255,0.4)", color: "#8C6B9E", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>
                        <span>✓ Completed today ({completedRows.length})</span>
                        <span style={{ transform: completedTodayExpanded ? "rotate(180deg)" : "none", transition: "transform .2s" }}>▾</span>
                      </button>
                      {completedTodayExpanded && <div style={{ marginTop: 8 }}>{completedRows.map(renderRow)}</div>}
                    </div>
                  )}
                </div>
              );
                })()}
              </>
            )}
            {dailyCheckIn.day_type !== "rest" && (dailyCheckIn.custom_essentials?.length ? (
              dailyCheckIn.custom_essentials.every((key) => viewDone[key]) && (
                <div style={{ textAlign: "center", padding: "10px 0 2px", color: day.accent, fontWeight: 800, fontSize: 15 }}>✨ Today's essentials are done — that's enough. 💛</div>
              )
            ) : pct === 100 && (
              <div style={{ textAlign: "center", padding: "10px 0 2px", color: day.accent, fontWeight: 800, fontSize: 15 }}>{voice.dayComplete}</div>
            ))}
          </div>
        )}
        {todayCardIndex === 1 && rows.length === 0 && !babyMode && (
          <div style={{ marginBottom: 18, padding: 18, borderRadius: 20, background: "rgba(255,255,255,0.5)", border: "1px dashed #C9B3DC", textAlign: "center", color: "#8C6B9E", fontSize: 12.5 }}>
            <div>No tasks for today yet. Build a list that fits your day. 🧸</div>
            <button type="button" onClick={() => openTaskManager(dayIdForDate(period.date))} style={{ marginTop: 10, padding: "8px 12px", borderRadius: 9, border: 0, background: "#A65DC1", color: "white", fontWeight: 900, cursor: "pointer" }}>＋ Add today’s tasks</button>
          </div>
        )}
        </div>

        <button type="button" onClick={() => setCalmQuickOpen(true)} style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 13px", borderRadius: 12, border: "1px solid #E6D4F2", background: "rgba(255,255,255,0.55)", color: "#6B5A7D", fontWeight: 800, fontSize: 12.5, cursor: "pointer", marginBottom: 18 }}>
          <span>🛟 If I feel overwhelmed</span>
          <span style={{ color: "#C77DD6" }}>›</span>
        </button>

        <CalmPanel open={calmQuickOpen} onClose={() => setCalmQuickOpen(false)} currentCopingOption={currentCopingOption} reshuffle={reshuffle} setCareSection={setCareSection} goToDashboard={goToDashboard} />

  </>
  );
}
