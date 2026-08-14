// The Progress dashboard tab ("PlushGrowth") — module split phase 7,
// tenth slice (see docs/module-split-plan.md). Weekly/monthly trend
// charts, weekly intention, care story, care areas, PlushInsights,
// and weekly highlights, across three sub-views (overview/story/areas).
// HabitTypeIcon imported directly from ./shared.jsx (already its own
// module); datesThroughToday read from window.PlushLifeSchedule
// inside this file. TREND_WEEKS/TREND_MONTHS passed as props since
// they're plain literals in app-source.jsx, not window globals.
//
// Note: the `{false && ...}` blocks for CARE STORY/CARE AREAS inside
// the "overview" sub-view are pre-existing dead code (superseded by
// the separate "story"/"areas" tabs below them) — left exactly as-is,
// not touched by this move.
import { HabitTypeIcon } from "./shared.jsx";
import { HabitGrowthTools } from "./habit-intelligence.jsx";

function HabitGardenCard({ habitTasks, habitGardenGrowthPct, habitGardenTotalCheckIns, habitGardenOpen, setHabitGardenOpen }) {
  if (!habitTasks?.length) return null;
  return <div style={{ marginBottom: 18, padding: 16, borderRadius: 18, background: "#F2FFF8CC", border: "1px solid #BFE5D2" }}>
    <div style={{ fontSize: 11, letterSpacing: "0.14em", fontWeight: 900, color: "#318C79" }}>🌱 HABIT GARDEN & REWARDS</div>
    <div style={{ marginTop: 5, fontSize: 12, lineHeight: 1.5, color: "#5E766F" }}>Your habit progress and earned rewards live here in PlushGrowth.</div>
    <div style={{ marginTop: 10, padding: "9px 10px", borderRadius: 11, background: "#FFFFFFB8", border: "1px solid #D7EEE2" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline", color: "#4D746A" }}><strong style={{ fontSize: 11.5 }}>Growing toward your next rewards</strong><strong style={{ fontSize: 13 }}>{habitGardenGrowthPct}%</strong></div>
      <div style={{ height: 7, marginTop: 6, overflow: "hidden", borderRadius: 99, background: "#E2F3EA" }}><div style={{ width: `${habitGardenGrowthPct}%`, height: "100%", borderRadius: 99, background: "linear-gradient(90deg,#4DD0B0,#4C8FE8)", transition: "width .4s ease" }} /></div>
      <div style={{ marginTop: 5, fontSize: 10.5, color: "#6B8A82" }}>{habitGardenTotalCheckIns} caring {habitGardenTotalCheckIns === 1 ? "check-in" : "check-ins"} across {habitTasks.length} {habitTasks.length === 1 ? "habit" : "habits"}.</div>
    </div>
    <button type="button" onClick={() => setHabitGardenOpen((open) => !open)} aria-expanded={habitGardenOpen} style={{ marginTop: 10, padding: "6px 9px", borderRadius: 8, border: "1px solid #A9DFC4", background: "white", color: "#318C79", fontWeight: 900, fontSize: 10.5, cursor: "pointer" }}>{habitGardenOpen ? "Hide garden details" : `View ${habitTasks.length} habits`}</button>
    {habitGardenOpen && <div style={{ display: "grid", gap: 8, marginTop: 11 }}>{habitTasks.map((habit) => {
      const nextCount = habit.stats.nextReward?.count;
      const progressPct = nextCount ? Math.min(100, Math.round((habit.stats.total / nextCount) * 100)) : 100;
      const remaining = nextCount ? Math.max(0, nextCount - habit.stats.total) : 0;
      return <div key={habit.task_key} style={{ padding: "10px 11px", borderRadius: 12, background: "#FFFFFFB8", border: "1px solid #D7EEE2" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
          <div style={{ fontSize: 13.5, fontWeight: 900, color: "#4F405C" }}>{habit.habitType === "build" ? "🌱" : "🍂"} {habit.task}</div>
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}><span style={{ padding: "3px 7px", borderRadius: 999, background: habit.habitType === "build" ? "#EAF4FF" : "#FFF3E4", color: habit.habitType === "build" ? "#4C8FE8" : "#B4761D", fontSize: 9.5, fontWeight: 800 }}>{habit.habitType === "build" ? "Building" : "Breaking"}</span>{habit.stats.current > 0 && <span style={{ padding: "4px 7px", borderRadius: 999, background: "#FFF3E4", color: "#B4761D", fontSize: 10.5, fontWeight: 900 }}>🔥 {habit.stats.current}-day streak</span>}<span style={{ padding: "4px 7px", borderRadius: 999, background: "#E7F7EF", color: "#318C79", fontSize: 10.5, fontWeight: 900 }}>{habit.stats.total} total</span></div>
        </div>
        {habit.stats.earnedReward && <div style={{ marginTop: 5, fontSize: 11.5, color: "#6B7E78" }}>Earned: {habit.stats.earnedReward.badge} {habit.stats.earnedReward.label}</div>}
        {habit.stats.nextReward && <><div style={{ marginTop: 6, fontSize: 11.5, color: "#6B7E78" }}>Next: {habit.stats.nextReward.badge} {habit.stats.nextReward.label} — {remaining === 0 ? "almost there!" : `${remaining} more ${remaining === 1 ? "check-in" : "check-ins"}`}</div><div style={{ height: 6, background: "#E2F3EA", borderRadius: 4, marginTop: 5, overflow: "hidden" }}><div style={{ height: "100%", width: `${progressPct}%`, background: habit.habitType === "build" ? "#4C8FE8" : "#D4A017", borderRadius: 4 }} /></div></>}
      </div>;
    })}</div>}
  </div>;
}

export function ProgressPanel({ open, progressView, setProgressView, weeklyIntentionEditing, setWeeklyIntentionEditing, weeklyIntentionDraft, setWeeklyIntentionDraft, weeklyIntentionText, saveWeeklyIntentionEdit, hasWeeklyActivity, goToDashboard, weeklyOverallPct, weekOverWeekDelta, preferences, weeklyEssentialPct, weeklyOverallDone, weeklyOverallPossible, weeklyBonusDone, caringDays, weeklyEssentialDone, careStory, careAreas, openTaskManager, patternInsightCards, insightCardIndex, setInsightCardIndex, weeklyHighlights, period, goWriteWeeklyIntention, setShareCardOpen, progressDetailsOpen, setProgressDetailsOpen, TREND_WEEKS, TREND_MONTHS, currentMonthKey, monthlyOverallPct, monthOverMonthDelta, monthlyTrendPoints, tappedTrendMonth, setTappedTrendMonth, monthlyMostConsistent, currentMonthDates, weeklyTrendPoints, tappedTrendWeek, setTappedTrendWeek, habitTasks, habitGardenGrowthPct, habitGardenTotalCheckIns, habitGardenOpen, setHabitGardenOpen }) {
  if (!open) return null;
  const { datesThroughToday } = window.PlushLifeSchedule;
  return (
  <>
        <div role="tablist" aria-label="Progress views" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 6, marginBottom: 12, padding: 5, borderRadius: 14, background: "#F3E8FA", border: "1px solid #E6D4F2" }}>
          {[{ id: "overview", label: "Overview", icon: "📊" }, { id: "story", label: "Story", icon: "📖" }, { id: "areas", label: "Areas", icon: "🪴" }].map((item) => {
            const selected = progressView === item.id;
            return <button key={item.id} type="button" role="tab" aria-selected={selected} onClick={() => setProgressView(item.id)} style={{ minWidth: 0, padding: "8px 4px", borderRadius: 10, border: selected ? "2px solid #A65DC1" : "1px solid transparent", background: selected ? "white" : "transparent", color: selected ? "#7A3D93" : "#8C6B9E", fontSize: 10.5, fontWeight: 900, cursor: "pointer" }}>{item.icon} {item.label}</button>;
          })}
        </div>
        <button type="button" onClick={() => goToDashboard("week")} style={{ width: "100%", minHeight: 44, margin: "-3px 0 12px", padding: "8px 11px", borderRadius: 11, border: "1px solid #D9C6E5", background: "#FFFFFFB8", color: "#765F84", fontWeight: 900, fontSize: 11.5, cursor: "pointer" }}>📅 Calendar & history</button>
        {progressView === "overview" && <>
        <div style={{ marginBottom: 12, padding: "11px 12px", borderRadius: 12, background: "#F9F1FC", border: "1px solid #E6D4F2" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <div style={{ fontSize: 10.5, letterSpacing: "0.1em", fontWeight: 900, color: "#8E4EAA" }}>📮 PLUSHWEEK · WEEKLY INTENTION</div>
            {!weeklyIntentionEditing && <button type="button" onClick={() => { setWeeklyIntentionDraft(weeklyIntentionText); setWeeklyIntentionEditing(true); }} style={{ padding: "5px 8px", borderRadius: 8, border: "1px solid #D9B8E8", background: "white", color: "#8E4EAA", fontWeight: 900, fontSize: 11, cursor: "pointer" }}>{weeklyIntentionText ? "Edit" : "Add one"}</button>}
          </div>
          <div style={{ marginTop: 4, fontSize: 10.5, color: "#927C9E" }}>Weekly planning and Sunday follow-up · separate from PlushJournal</div>
          {weeklyIntentionEditing ? <>
            <textarea value={weeklyIntentionDraft} onChange={(event) => setWeeklyIntentionDraft(event.target.value)} maxLength={2000} placeholder="Example: Be a little gentler with myself this week." style={{ width: "100%", boxSizing: "border-box", minHeight: 70, marginTop: 8, padding: 10, borderRadius: 10, border: "1px solid #D9B8E8", resize: "vertical" }} />
            <div style={{ display: "flex", gap: 7, marginTop: 7 }}><button type="button" onClick={saveWeeklyIntentionEdit} style={{ padding: "7px 11px", borderRadius: 9, border: 0, background: "#A65DC1", color: "white", fontWeight: 900, cursor: "pointer" }}>Save</button><button type="button" onClick={() => setWeeklyIntentionEditing(false)} style={{ padding: "7px 11px", borderRadius: 9, border: "1px solid #D9B8E8", background: "white", color: "#8E4EAA", fontWeight: 800, cursor: "pointer" }}>Cancel</button></div>
          </> : <div style={{ marginTop: 5, fontSize: 12.5, lineHeight: 1.45, color: weeklyIntentionText ? "#6B5A7D" : "#9A86A7" }}>{weeklyIntentionText || "Optional—a simple direction for the week, not another task."}</div>}
        </div>
        {!hasWeeklyActivity && <div style={{ marginBottom: 18, padding: "16px 15px", borderRadius: 18, background: "#F2FFFB", border: "1px solid #C8E8DE", boxShadow: "0 8px 24px rgba(77,132,112,.08)", color: "#55766E" }}>
          <div style={{ fontSize: 10.5, letterSpacing: "0.12em", fontWeight: 900, color: "#318C79" }}>🌱 YOUR PROGRESS CAN START TINY</div>
          <div style={{ marginTop: 6, fontSize: 14, lineHeight: 1.5, fontWeight: 800 }}>Your story gets to begin softly.</div>
          <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.5 }}>One little task, check-in, or kind pause is enough. When you do one, your week will begin to bloom here.</div>
          <button type="button" onClick={() => goToDashboard("today")} style={{ marginTop: 11, padding: "8px 10px", borderRadius: 9, border: "1px solid #84C9B7", background: "white", color: "#318C79", fontWeight: 900, fontSize: 11.5, cursor: "pointer" }}>Show me today’s tiny thing</button>
        </div>}
        <div style={{ marginBottom: 18, padding: 18, borderRadius: 20, background: "rgba(255,255,255,0.5)", border: "1px solid #E6D4F2", boxShadow: "0 8px 24px rgba(183,143,224,0.10)" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "#A65DC1", fontWeight: 800 }}>THIS WEEK · MON–SUN</div>
              <div style={{ marginTop: 4, fontSize: 19, color: "#5B4B6B", fontWeight: 800 }}>PlushGrowth ✨</div>
            </div>
            <div style={{ fontSize: 27, color: "#A65DC1", fontWeight: 900 }}>{weeklyOverallPct}%</div>
          </div>
          <div style={{ height: 12, marginTop: 12, overflow: "hidden", borderRadius: 8, background: "#F2E8F8" }}>
            <div style={{ height: "100%", width: `${weeklyOverallPct}%`, borderRadius: 8, background: "linear-gradient(90deg, #C77DD6, #7FC8F8)", transition: "width .4s ease" }} />
          </div>
          {weekOverWeekDelta !== null && (
            <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: weekOverWeekDelta > 0 ? "#318C79" : weekOverWeekDelta < 0 ? "#8C6B9E" : "#8C6B9E" }}>
              {weekOverWeekDelta > 0 ? `📈 ${weekOverWeekDelta}% more than last week` : weekOverWeekDelta < 0 ? `${Math.abs(weekOverWeekDelta)}% less than last week — that's okay 💛` : "Same as last week"}
            </div>
          )}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 10.5, letterSpacing: "0.14em", color: "#8C6B9E", fontWeight: 800 }}>LAST {TREND_WEEKS + 1} WEEKS</div>
            <div style={{ position: "relative", marginTop: 10, height: 64 }}>
              <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 1, background: "#EDE0F5" }} />
              <div style={{ position: "absolute", left: 0, right: 0, top: 32, height: 1, background: "#EDE0F5" }} />
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "flex", alignItems: "flex-end", gap: 3, height: 64 }}>
                {weeklyTrendPoints.map((point, index) => (
                  <button
                    key={point.weekStart}
                    type="button"
                    onClick={() => setTappedTrendWeek(tappedTrendWeek === point.weekStart ? null : point.weekStart)}
                    aria-label={`Week of ${new Date(`${point.weekStart}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}: ${point.pct === null ? "no data" : `${point.pct}%`}`}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      height: point.pct === null ? 3 : Math.max(4, Math.round((point.pct / 100) * 56)),
                      borderRadius: "4px 4px 0 0",
                      border: point.isCurrent ? "2px solid #7A3D93" : tappedTrendWeek === point.weekStart ? "2px solid #A65DC1" : "none",
                      background: point.pct === null ? "#EDE0F5" : point.isCurrent ? "linear-gradient(180deg, #C77DD6, #7FC8F8)" : "#D9B3E8",
                      padding: 0,
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 9.5, color: "#8C6B9E" }}>
              <span>{new Date(`${weeklyTrendPoints[0].weekStart}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
              <span>This week</span>
            </div>
            {tappedTrendWeek && (() => {
              const tapped = weeklyTrendPoints.find((point) => point.weekStart === tappedTrendWeek);
              if (!tapped) return null;
              const weekLabel = tapped.isCurrent ? "This week" : `Week of ${new Date(`${tapped.weekStart}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
              return (
                <div style={{ marginTop: 8, padding: "7px 10px", borderRadius: 10, background: "#F2E3FA", fontSize: 12, fontWeight: 700, color: "#7A3D93" }}>
                  {weekLabel}: {tapped.pct === null ? "no data" : `${tapped.pct}%`}
                </div>
              );
            })()}
          </div>
          <div style={{ display: hasWeeklyActivity && progressDetailsOpen ? "grid" : "none", gridTemplateColumns: preferences.gentle_streaks ? "repeat(2, minmax(0, 1fr))" : "repeat(3, minmax(0, 1fr))", gap: 8, marginTop: 12 }}>
            <div style={{ padding: "10px 8px", borderRadius: 12, textAlign: "center", background: "#FFF8FC" }}>
              <div style={{ fontSize: 17, fontWeight: 900, color: "#A65DC1" }}>{weeklyEssentialPct}%</div>
              <div style={{ marginTop: 2, fontSize: 10.5, color: "#8C6B9E" }}>ESSENTIALS</div>
            </div>
            <div style={{ padding: "10px 8px", borderRadius: 12, textAlign: "center", background: "#F7FBFF" }}>
              <div style={{ fontSize: 17, fontWeight: 900, color: "#4C8FE8" }}>{weeklyOverallDone}/{weeklyOverallPossible}</div>
              <div style={{ marginTop: 2, fontSize: 10.5, color: "#8C6B9E" }}>CORE + SCHEDULED</div>
            </div>
            <div style={{ padding: "10px 8px", borderRadius: 12, textAlign: "center", background: "#FFFBEF" }}>
              <div style={{ fontSize: 17, fontWeight: 900, color: "#D4A017" }}>{weeklyBonusDone}</div>
              <div style={{ marginTop: 2, fontSize: 10.5, color: "#8C6B9E" }}>BONUS WINS</div>
            </div>
            {preferences.gentle_streaks && <div style={{ padding: "10px 8px", borderRadius: 12, textAlign: "center", background: "#F1FFF9" }}>
              <div style={{ fontSize: 17, fontWeight: 900, color: "#318C79" }}>{caringDays}</div>
              <div style={{ marginTop: 2, fontSize: 10.5, color: "#8C6B9E" }}>CARING DAYS</div>
            </div>}
          </div>
          {hasWeeklyActivity && progressDetailsOpen && <div style={{ marginTop: 10, fontSize: 11.5, lineHeight: 1.45, color: "#8C6B9E" }}>
            Bonus items are celebrated separately, so they never lower your essentials score. 💛
          </div>}
          {hasWeeklyActivity && progressDetailsOpen && <div style={{ marginTop: 9, padding: "9px 10px", borderRadius: 10, background: "#FFFFFF99", fontSize: 11.5, lineHeight: 1.45, color: "#6B5A7D" }}>
            <strong>Gentle weekly review:</strong> {weeklyEssentialDone} essentials and {weeklyBonusDone} bonus wins completed across {caringDays} caring {caringDays === 1 ? "day" : "days"}. A missed day never erases the care you gave yourself.
          </div>}
          {false && <div style={{ marginTop: 9, padding: "12px", borderRadius: 12, background: "#F5FBF8", border: "1px solid #CFE8E1", color: "#526F67" }}>
            <div style={{ fontSize: 9.5, letterSpacing: "0.12em", fontWeight: 900, color: "#318C79" }}>📖 YOUR CARE STORY</div>
            <div style={{ marginTop: 5, fontSize: 11.5, lineHeight: 1.55 }}>{careStory.map((line, index) => <div key={index} style={{ marginTop: index ? 3 : 0 }}>{line}</div>)}</div>
            <div style={{ marginTop: 7, fontSize: 10.5, lineHeight: 1.4, color: "#6B8A82" }}>A gentle reflection on what you chose—not a score, diagnosis, or rule for next week.</div>
          </div>}
          {false && careAreas.length > 0 && (
            <div style={{ marginTop: 9, padding: "12px", borderRadius: 12, background: "#F7F9FF", border: "1px solid #D9E6F6" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}>
                <div style={{ fontSize: 9.5, letterSpacing: "0.12em", fontWeight: 900, color: "#4C78A8" }}>🪴 CARE AREAS</div>
                <button type="button" onClick={() => openTaskManager()} style={{ padding: "4px 7px", borderRadius: 7, border: "1px solid #B9DCF6", background: "white", color: "#3D70A3", fontWeight: 800, fontSize: 10, cursor: "pointer" }}>Edit groups</button>
              </div>
              <div style={{ marginTop: 5, fontSize: 10.5, lineHeight: 1.4, color: "#6B7C99" }}>Your task groups become your care areas. Rename or make a group anytime from task settings.</div>
              <div style={{ display: "grid", gap: 6, marginTop: 9 }}>
                {careAreas.map((area) => (
                  <div key={area.label} style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 8, alignItems: "center" }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 11, color: "#536C89" }}><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontWeight: 800 }}>{area.label}</span><span>{area.done}/{area.possible}</span></div>
                      <div style={{ height: 5, marginTop: 3, overflow: "hidden", borderRadius: 99, background: "#E6EFF9" }}><div style={{ height: "100%", width: `${area.pct}%`, borderRadius: 99, background: "#7FC8F8" }} /></div>
                    </div>
                    <span style={{ minWidth: 30, textAlign: "right", fontSize: 11, fontWeight: 900, color: "#4C8FE8" }}>{area.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {progressDetailsOpen && patternInsightCards.length > 0 && (() => {
            const card = patternInsightCards[insightCardIndex % patternInsightCards.length];
            return (
              <div key={card.key} style={{ marginTop: 9, padding: "11px 12px", borderRadius: 12, background: card.background, border: `1px solid ${card.border}`, fontSize: 11.5, lineHeight: 1.5, color: card.color }}>
                <div style={{ fontSize: 9.5, letterSpacing: "0.12em", fontWeight: 900, marginBottom: 4, opacity: 0.75 }}>💡 PLUSHINSIGHTS</div>
                {card.node}
                {patternInsightCards.length > 1 && (
                  <button type="button" onClick={() => setInsightCardIndex((index) => index + 1)} style={{ marginTop: 8, padding: "5px 9px", borderRadius: 8, border: `1px solid ${card.border}`, background: "white", color: card.color, fontWeight: 800, fontSize: 10.5, cursor: "pointer" }}>
                    Next insight ({(insightCardIndex % patternInsightCards.length) + 1} of {patternInsightCards.length}) →
                  </button>
                )}
              </div>
            );
          })()}
          {hasWeeklyActivity && weeklyHighlights && (
            <div style={{ marginTop: 9, padding: "11px 12px", borderRadius: 12, background: "#FFF9FD", border: "1px solid #F0D5E8", fontSize: 11.5, lineHeight: 1.6, color: "#6B5A7D" }}>
              <strong>🌟 Plush highlights:</strong>
              {weeklyHighlights.mostConsistent && (
                <div style={{ marginTop: 4 }}>Most consistent routine: <strong><HabitTypeIcon task={weeklyHighlights.mostConsistent.task} />{weeklyHighlights.mostConsistent.task.task}</strong> ({weeklyHighlights.mostConsistent.count} of {datesThroughToday(period).length} days)</div>
              )}
              {weeklyHighlights.topTool && (
                <div style={{ marginTop: 4 }}>Most helpful comfort tool: <strong>{weeklyHighlights.topTool.icon} {weeklyHighlights.topTool.name || weeklyHighlights.topTool.title}</strong></div>
              )}
              {weeklyHighlights.topMood && (
                <div style={{ marginTop: 4 }}>Most common check-in feeling this week: <strong>{weeklyHighlights.topMood}</strong></div>
              )}
            </div>
          )}
          <button type="button" onClick={goWriteWeeklyIntention} style={{ display: progressDetailsOpen ? undefined : "none", marginTop: 9, width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid #E6D4F2", background: "white", color: "#A65DC1", fontWeight: 800, fontSize: 12.5, cursor: "pointer" }}>📝 Set next week's intention</button>
          <button type="button" onClick={() => setShareCardOpen(true)} style={{ display: progressDetailsOpen ? undefined : "none", marginTop: 8, width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid #E6D4F2", background: "white", color: "#A65DC1", fontWeight: 800, fontSize: 12.5, cursor: "pointer" }}>📸 Share my week</button>
        </div>

        <button type="button" onClick={() => setProgressDetailsOpen((open) => !open)} aria-expanded={progressDetailsOpen} style={{ width: "100%", margin: "-6px 0 14px", padding: "9px 12px", borderRadius: 10, border: "1px solid #E6D4F2", background: "white", color: "#8E4EAA", fontWeight: 900, fontSize: 12, cursor: "pointer" }}>{progressDetailsOpen ? "Hide monthly details" : "Show monthly details"}</button>

        <div style={{ display: progressDetailsOpen ? undefined : "none", marginBottom: 18, padding: 18, borderRadius: 20, background: "rgba(255,255,255,0.5)", border: "1px solid #E6D4F2", boxShadow: "0 8px 24px rgba(183,143,224,0.10)" }}>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: "0.18em", color: "#A65DC1", fontWeight: 800 }}>{new Date(`${currentMonthKey}-01T12:00:00`).toLocaleDateString("en-US", { month: "long" }).toUpperCase()} SO FAR</div>
              <div style={{ marginTop: 4, fontSize: 19, color: "#5B4B6B", fontWeight: 800 }}>Monthly trends 📊</div>
            </div>
            <div style={{ fontSize: 27, color: "#A65DC1", fontWeight: 900 }}>{monthlyOverallPct}%</div>
          </div>
          <div style={{ height: 12, marginTop: 12, overflow: "hidden", borderRadius: 8, background: "#F2E8F8" }}>
            <div style={{ height: "100%", width: `${monthlyOverallPct}%`, borderRadius: 8, background: "linear-gradient(90deg, #C77DD6, #7FC8F8)", transition: "width .4s ease" }} />
          </div>
          {monthOverMonthDelta !== null && (
            <div style={{ marginTop: 8, fontSize: 12, fontWeight: 700, color: monthOverMonthDelta > 0 ? "#318C79" : "#8C6B9E" }}>
              {monthOverMonthDelta > 0 ? `📈 ${monthOverMonthDelta}% ahead of where you were at this point last month` : monthOverMonthDelta < 0 ? `${Math.abs(monthOverMonthDelta)}% behind where you were at this point last month — that's okay 💛` : "Same as this point last month"}
            </div>
          )}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 10.5, letterSpacing: "0.14em", color: "#8C6B9E", fontWeight: 800 }}>LAST {TREND_MONTHS + 1} MONTHS</div>
            <div style={{ position: "relative", marginTop: 10, height: 64 }}>
              <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 1, background: "#EDE0F5" }} />
              <div style={{ position: "absolute", left: 0, right: 0, top: 32, height: 1, background: "#EDE0F5" }} />
              <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, display: "flex", alignItems: "flex-end", gap: 3, height: 64 }}>
                {monthlyTrendPoints.map((point) => (
                  <button
                    key={point.monthKey}
                    type="button"
                    onClick={() => setTappedTrendMonth(tappedTrendMonth === point.monthKey ? null : point.monthKey)}
                    aria-label={`${new Date(`${point.monthKey}-01T12:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" })}: ${point.pct === null ? "no data" : `${point.pct}%`}`}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      height: point.pct === null ? 3 : Math.max(4, Math.round((point.pct / 100) * 56)),
                      borderRadius: "4px 4px 0 0",
                      border: point.isCurrent ? "2px solid #7A3D93" : tappedTrendMonth === point.monthKey ? "2px solid #A65DC1" : "none",
                      background: point.pct === null ? "#EDE0F5" : point.isCurrent ? "linear-gradient(180deg, #C77DD6, #7FC8F8)" : "#D9B3E8",
                      padding: 0,
                      cursor: "pointer",
                    }}
                  />
                ))}
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 9.5, color: "#8C6B9E" }}>
              <span>{new Date(`${monthlyTrendPoints[0].monthKey}-01T12:00:00`).toLocaleDateString("en-US", { month: "short", year: "2-digit" })}</span>
              <span>This month</span>
            </div>
            {tappedTrendMonth && (() => {
              const tapped = monthlyTrendPoints.find((point) => point.monthKey === tappedTrendMonth);
              if (!tapped) return null;
              const monthLabel = tapped.isCurrent ? "This month" : new Date(`${tapped.monthKey}-01T12:00:00`).toLocaleDateString("en-US", { month: "long", year: "numeric" });
              return (
                <div style={{ marginTop: 8, padding: "7px 10px", borderRadius: 10, background: "#F2E3FA", fontSize: 12, fontWeight: 700, color: "#7A3D93" }}>
                  {monthLabel}: {tapped.pct === null ? "no data" : `${tapped.pct}%`}
                </div>
              );
            })()}
          </div>
          {monthlyMostConsistent && (
            <div style={{ marginTop: 12, padding: "9px 10px", borderRadius: 10, background: "#FFFFFF99", fontSize: 11.5, lineHeight: 1.45, color: "#6B5A7D" }}>
              Most consistent this month: <strong><HabitTypeIcon task={monthlyMostConsistent.task} />{monthlyMostConsistent.task.task}</strong> ({monthlyMostConsistent.count} of {currentMonthDates.length} days)
            </div>
          )}
        </div>
        <HabitGardenCard habitTasks={habitTasks} habitGardenGrowthPct={habitGardenGrowthPct} habitGardenTotalCheckIns={habitGardenTotalCheckIns} habitGardenOpen={habitGardenOpen} setHabitGardenOpen={setHabitGardenOpen} />
        <HabitGrowthTools rows={habitTasks} period={period} openTaskManager={openTaskManager} />
        </>}
        {progressView === "story" && (
          <div style={{ marginBottom: 18, padding: 16, borderRadius: 18, background: "#F5FBF8", border: "1px solid #CFE8E1", boxShadow: "0 8px 24px rgba(77,132,112,.08)", color: "#526F67" }}>
            <div style={{ fontSize: 10.5, letterSpacing: "0.14em", fontWeight: 900, color: "#318C79" }}>📖 YOUR CARE STORY · THIS WEEK</div>
            <div style={{ marginTop: 7, fontSize: 14, lineHeight: 1.6 }}>{careStory.map((line, index) => <div key={index} style={{ marginTop: index ? 5 : 0 }}>{line}</div>)}</div>
            <div style={{ marginTop: 12, paddingTop: 11, borderTop: "1px solid #D8EEE5", fontSize: 11.5, lineHeight: 1.55 }}>This is a reflection on the care you chose—not a score, diagnosis, or rule for next week.</div>
            {weeklyHighlights && <div style={{ marginTop: 12, padding: 11, borderRadius: 11, background: "white", border: "1px solid #D8EEE5", fontSize: 11.5, lineHeight: 1.6 }}><strong>Small highlights:</strong>{weeklyHighlights.mostConsistent && <div style={{ marginTop: 4 }}>Steady routine: <strong><HabitTypeIcon task={weeklyHighlights.mostConsistent.task} />{weeklyHighlights.mostConsistent.task.task}</strong></div>}{weeklyHighlights.topTool && <div style={{ marginTop: 4 }}>Helpful support: <strong>{weeklyHighlights.topTool.icon} {weeklyHighlights.topTool.name || weeklyHighlights.topTool.title}</strong></div>}{weeklyHighlights.topMood && <div style={{ marginTop: 4 }}>Most common check-in: <strong>{weeklyHighlights.topMood}</strong></div>}</div>}
            <button type="button" onClick={goWriteWeeklyIntention} style={{ marginTop: 12, width: "100%", padding: "9px 12px", borderRadius: 10, border: "1px solid #A9DCCD", background: "white", color: "#318C79", fontWeight: 900, cursor: "pointer" }}>📝 Set next week's intention</button>
          </div>
        )}
        {progressView === "areas" && (
          <div style={{ marginBottom: 18, padding: 16, borderRadius: 18, background: "#F7F9FF", border: "1px solid #D9E6F6", boxShadow: "0 8px 24px rgba(76,143,232,.08)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "baseline" }}><div style={{ fontSize: 10.5, letterSpacing: "0.14em", fontWeight: 900, color: "#4C78A8" }}>🪴 YOUR CARE AREAS</div><button type="button" onClick={() => openTaskManager()} style={{ padding: "5px 8px", borderRadius: 8, border: "1px solid #B9DCF6", background: "white", color: "#3D70A3", fontWeight: 900, fontSize: 10.5, cursor: "pointer" }}>Edit groups</button></div>
            <div style={{ marginTop: 6, fontSize: 11.5, lineHeight: 1.45, color: "#6B7C99" }}>Your task groups become your care areas. Rename or make a group anytime from task settings.</div>
            {careAreas.length ? <div style={{ display: "grid", gap: 10, marginTop: 14 }}>{careAreas.map((area) => <div key={area.label} style={{ padding: "10px 11px", borderRadius: 11, background: "white", border: "1px solid #DCEAF8" }}><div style={{ display: "flex", justifyContent: "space-between", gap: 8, fontSize: 12, color: "#536C89" }}><strong>{area.label}</strong><span>{area.done}/{area.possible} · {area.pct}%</span></div><div style={{ height: 7, marginTop: 7, overflow: "hidden", borderRadius: 99, background: "#E6EFF9" }}><div style={{ height: "100%", width: `${area.pct}%`, borderRadius: 99, background: "linear-gradient(90deg,#7FC8F8,#4C8FE8)" }} /></div></div>)}</div> : <div style={{ marginTop: 12, padding: 11, borderRadius: 10, background: "white", color: "#6B7C99", fontSize: 12 }}>Add a few task groups and your care areas will appear here.</div>}
          </div>
        )}
  </>
  );
}
