// ToolPanel viewers with local derived state — module split phase 7,
// second slice (see docs/module-split-plan.md). Each keeps the small
// IIFE-style derivation its body used to compute inline (entry/mood/
// energy lookups, path progress, etc.) — only the JSX and its inputs
// moved, not the computation shape. PLUSH_PATHS/SLEEP_TOOLS are read
// from window.PlushLifeContent directly (same global app-source.jsx
// itself reads), not passed as props, since they're already exposed
// there from phase 1.
import { ToolPanel } from "./shared.jsx";

export function MoodViewer({ checkInViewerDate, onClose, dailyCheckInHistory, reflectionDateSet, setReflectionViewerDate, deleteDailyCheckIn, CHECKIN_MOODS, ENERGY_LEVELS, DAY_TYPES, SUPPORT_PREFERENCES }) {
  if (!checkInViewerDate) return null;
          const entry = dailyCheckInHistory.find((row) => row.check_date === checkInViewerDate);
          if (!entry) return null;
          const mood = CHECKIN_MOODS.find(([value]) => value === entry.mood);
          const energy = ENERGY_LEVELS.find(([value]) => value === entry.energy);
          const dayType = DAY_TYPES.find(([value]) => value === entry.day_type);
          const support = SUPPORT_PREFERENCES.find(([value]) => value === entry.support_preference);
          const capacity = { very_low: "😞 Very low", low: "😕 Low", usual: "🙂 Usual", high: "💪 High" }[entry.capacity];
          return <ToolPanel title="PlushMood" onClose={onClose}>
            <div style={{ padding: 18, borderRadius: 20, background: "linear-gradient(145deg,#FFF9FD,#F2FFFB)", border: "1px solid #E3C9EC" }}>
              <div style={{ fontSize: 11, letterSpacing: ".13em", fontWeight: 900, color: "#A65DC1" }}>{new Date(`${checkInViewerDate}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).toUpperCase()}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8, marginTop: 11 }}>
                <div style={{ padding: 11, borderRadius: 12, background: "white", border: "1px solid #E9DDEC" }}><div style={{ fontSize: 10, color: "#8C6B9E", fontWeight: 900 }}>FEELING</div><div style={{ marginTop: 4, fontWeight: 900, color: "#5B4B6B" }}>{mood ? `${mood[1]} ${mood[2]}` : "Not recorded"}</div></div>
                <div style={{ padding: 11, borderRadius: 12, background: "white", border: "1px solid #E9DDEC" }}><div style={{ fontSize: 10, color: "#8C6B9E", fontWeight: 900 }}>CAPACITY</div><div style={{ marginTop: 4, fontWeight: 900, color: "#5B4B6B" }}>{capacity || "Not recorded"}</div></div>
                <div style={{ padding: 11, borderRadius: 12, background: "white", border: "1px solid #CFE8E1" }}><div style={{ fontSize: 10, color: "#6B8A82", fontWeight: 900 }}>ENERGY</div><div style={{ marginTop: 4, fontWeight: 900, color: "#526F67" }}>{energy ? `${energy[1]} ${energy[2]}` : "Not recorded"}</div></div>
                <div style={{ padding: 11, borderRadius: 12, background: "white", border: "1px solid #CFE4F5" }}><div style={{ fontSize: 10, color: "#6B7C99", fontWeight: 900 }}>DAY TYPE</div><div style={{ marginTop: 4, fontWeight: 900, color: "#4C6F98" }}>{dayType ? `${dayType[1]} ${dayType[2]}` : "Full"}</div></div>
                <div style={{ padding: 11, borderRadius: 12, background: "white", border: "1px solid #F0D99E" }}><div style={{ fontSize: 10, color: "#A56D14", fontWeight: 900 }}>WANTED</div><div style={{ marginTop: 4, fontWeight: 900, color: "#7B641E" }}>{support ? `${support[1]} ${support[2]}` : "Not recorded"}</div></div>
              </div>
              <div style={{ display: "flex", gap: 7, marginTop: 12, flexWrap: "wrap" }}>
                {reflectionDateSet.has(checkInViewerDate) && <button type="button" onClick={() => { onClose(); setReflectionViewerDate(checkInViewerDate); }} style={{ padding: "7px 10px", borderRadius: 9, border: "1px solid #E3C9EC", background: "white", color: "#A65DC1", fontWeight: 900, fontSize: 11.5, cursor: "pointer" }}>Open private reflection</button>}
                <button type="button" onClick={() => deleteDailyCheckIn(checkInViewerDate)} style={{ padding: "7px 10px", borderRadius: 9, border: "1px solid #F0B8C4", background: "#FFF7F9", color: "#C45D74", fontWeight: 900, fontSize: 11.5, cursor: "pointer" }}>Delete this check-in</button>
              </div>
            </div>
          </ToolPanel>;
}

export function CarePathViewer({ selectedCarePath, onClose, pathProgress, expandedPathDay, setExpandedPathDay, pathDayJustCompleted, setPathDayJustCompleted, period, setReflectionViewerDate, updatePathDay, remindAboutPathDay, pauseCarePath }) {
  if (!selectedCarePath) return null;
  const { PLUSH_PATHS } = window.PlushLifeContent;
          const path = PLUSH_PATHS.find((item) => item.id === selectedCarePath);
          const progress = pathProgress.find((item) => item.path_id === selectedCarePath) || { current_day: 1, completed_days: [], status: "active" };
          if (!path) return null;
          const completionRatio = progress.completed_days.length / path.days.length;
          const growthEmoji = completionRatio >= 1 ? "🌸" : completionRatio >= 0.75 ? "🌳" : completionRatio >= 0.5 ? "🪴" : completionRatio >= 0.25 ? "🌿" : "🌱";
          const currentDayNumber = path.days.findIndex((_, index) => !progress.completed_days.includes(index + 1) && index + 1 <= progress.current_day) + 1;
          return <ToolPanel title={path.title} onClose={onClose}>
            <div style={{ padding: 17, borderRadius: 18, background: "#FFFDF4", border: "1px solid #E9C96E" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 32 }}>{path.icon}</span>
                <div style={{ flex: 1 }}><div style={{ fontWeight: 900, color: "#5B4B6B", fontSize: 17 }}>{path.title}</div><div style={{ marginTop: 2, color: "#8C6B9E", fontSize: 12 }}>{path.description}</div></div>
                <span aria-label={`Path growth: ${Math.round(completionRatio * 100)}% complete`} style={{ fontSize: 28 }}>{growthEmoji}</span>
              </div>
              {pathDayJustCompleted && (
                <div style={{ marginTop: 12, padding: "9px 11px", borderRadius: 10, background: "#F7ECFB", color: "#6B5A7D", fontSize: 11.5, lineHeight: 1.4, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                  <span>Step saved. Want to jot how it went?</span>
                  <button type="button" onClick={() => { setReflectionViewerDate(period.date); setPathDayJustCompleted(false); }} style={{ padding: "5px 9px", borderRadius: 8, border: "1px solid #D9B8E8", background: "white", color: "#8E4EAA", fontWeight: 900, fontSize: 11, cursor: "pointer" }}>Add a quick note</button>
                </div>
              )}
              <div style={{ display: "grid", gap: 8, marginTop: 14 }}>
                {path.days.map((day, index) => {
                  const dayNumber = index + 1;
                  const complete = progress.completed_days.includes(dayNumber);
                  const available = dayNumber <= progress.current_day || complete;
                  const expanded = expandedPathDay === dayNumber;
                  return <div key={dayNumber} style={{ borderRadius: 12, background: complete ? "#EAF8F4" : "white", border: `1px solid ${complete ? "#BFE5D2" : "#F0E4C2"}`, opacity: available ? 1 : .55 }}>
                    <div style={{ display: "flex", gap: 9, alignItems: "center", padding: "10px 11px", cursor: available ? "pointer" : "default" }} onClick={() => available && setExpandedPathDay(expanded ? null : dayNumber)}>
                      <span style={{ width: 24, height: 24, borderRadius: 8, display: "grid", placeItems: "center", background: complete ? "#318C79" : "#F7EDCF", color: complete ? "white" : "#A56D14", fontWeight: 900, fontSize: 11, flexShrink: 0 }}>{complete ? "✓" : dayNumber}</span>
                      <span style={{ flex: 1, color: "#5B4B6B", fontSize: 12.5, fontWeight: 800 }}>{day.label}</span>
                      {available && !complete && <button type="button" onClick={(event) => { event.stopPropagation(); updatePathDay(path.id, dayNumber); }} style={{ padding: "6px 8px", borderRadius: 8, border: 0, background: "#D4A017", color: "white", fontWeight: 900, fontSize: 10.5, cursor: "pointer" }}>Done</button>}
                    </div>
                    {expanded && (
                      <div style={{ padding: "0 12px 12px 45px", fontSize: 12, lineHeight: 1.5, color: "#7B6888" }}>
                        {day.guide}
                        {dayNumber === currentDayNumber && !complete && window.Capacitor?.isNativePlatform?.() && (
                          <button type="button" onClick={(event) => { event.stopPropagation(); remindAboutPathDay(day.label); }} style={{ display: "block", marginTop: 8, padding: "6px 9px", borderRadius: 8, border: "1px solid #E9C96E", background: "white", color: "#A56D14", fontWeight: 800, fontSize: 11, cursor: "pointer" }}>🔔 Remind me about this later</button>
                        )}
                      </div>
                    )}
                  </div>;
                })}
              </div>
              <button type="button" onClick={() => pauseCarePath(path.id)} style={{ marginTop: 12, padding: "7px 10px", borderRadius: 9, border: "1px solid #E9C96E", background: "white", color: "#A56D14", fontWeight: 900, fontSize: 11.5, cursor: "pointer" }}>{progress.status === "paused" ? "Resume this path" : "Pause this path"}</button>
            </div>
          </ToolPanel>;
}

export function SleepToolViewer({ sleepToolOpen, preferences, breathPhase, finishSleepSession }) {
  if (!sleepToolOpen) return null;
  const { SLEEP_TOOLS } = window.PlushLifeContent;
          const tool = SLEEP_TOOLS.find((item) => item.id === sleepToolOpen);
          if (!tool) return null;
          const showBreathingPacer = !!tool.breathingPacer && !preferences.reduced_motion;
          return <ToolPanel title={tool.title} onClose={finishSleepSession}>
            <div style={{ position: "relative", padding: 18, borderRadius: 20, overflow: "hidden", background: "linear-gradient(160deg,#1B2245,#2E3A6B 55%,#1B2245)", border: "1px solid #3B4A85" }}>
              {["8%,12%", "22%,28%", "68%,18%", "82%,40%", "40%,8%", "58%,32%"].map((position, index) => {
                const [left, top] = position.split(",");
                return <span key={index} aria-hidden="true" style={{ position: "absolute", left, top, fontSize: 10, color: "#C7D5F3", opacity: 0.8 }}>✦</span>;
              })}
              <div style={{ position: "relative", fontSize: 34 }}>{tool.icon}</div>
              {showBreathingPacer ? (
                <div style={{ position: "relative", display: "grid", justifyItems: "center", marginTop: 14 }}>
                  <div aria-live="polite" style={{
                    width: breathPhase === "out" ? 90 : 150,
                    height: breathPhase === "out" ? 90 : 150,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    background: "radial-gradient(circle at 35% 30%, #7C93E0, #3B4A85)",
                    color: "white",
                    fontWeight: 900,
                    fontSize: 14,
                    transition: `width ${breathPhase === "in" ? 4 : breathPhase === "out" ? 6 : 0.3}s ease-in-out, height ${breathPhase === "in" ? 4 : breathPhase === "out" ? 6 : 0.3}s ease-in-out`,
                  }}>
                    {breathPhase === "in" ? "Breathe in…" : breathPhase === "hold" ? "Hold…" : "Breathe out…"}
                  </div>
                  <div style={{ marginTop: 14, fontSize: 12, color: "#C7D5F3", textAlign: "center", lineHeight: 1.5 }}>{tool.steps[0]}</div>
                </div>
              ) : (
                <div style={{ position: "relative", marginTop: 10, display: "grid", gap: 9 }}>{tool.steps.map((step, index) => <div key={index} style={{ display: "flex", gap: 9, color: "#DCE3FA", fontSize: 13, lineHeight: 1.5 }}><strong style={{ color: "#93A9F5" }}>{index + 1}.</strong><span>{step}</span></div>)}</div>
              )}
              <button type="button" onClick={finishSleepSession} style={{ position: "relative", marginTop: 15, width: "100%", padding: "10px", borderRadius: 11, border: 0, background: "#7C93E0", color: "#1B2245", fontWeight: 900, cursor: "pointer" }}>Done for tonight</button>
            </div>
          </ToolPanel>;
}

export function JournalReflectionViewer({ reflectionViewerDate, onClose, reflectionViewerPrompt, reflectionViewerLoading, reflectionViewerNote }) {
  if (!reflectionViewerDate) return null;
  const { reflectionPromptForDay, dayIdForDate } = window.PlushLifeSchedule;
  return (
          <ToolPanel title="PlushJournal" onClose={onClose}>
            <div style={{ padding: 4 }}>
              <div style={{ fontSize: 11, letterSpacing: "0.14em", fontWeight: 900, color: "#A65DC1" }}>📝 PLUSHJOURNAL</div>
              <div style={{ marginTop: 6, fontSize: 14, fontWeight: 900, color: "#5B4B6B" }}>
                {new Date(reflectionViewerDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </div>
              <div style={{ marginTop: 12, padding: 11, borderRadius: 12, background: "#F7F0FB", border: "1px solid #DEC8EA" }}>
                <div style={{ fontSize: 10.5, letterSpacing: "0.12em", fontWeight: 900, color: "#A65DC1" }}>QUESTION</div>
                <div style={{ marginTop: 4, fontStyle: "italic", lineHeight: 1.5, color: "#6D5A7C" }}>
                  {reflectionViewerPrompt || reflectionPromptForDay(dayIdForDate(reflectionViewerDate), reflectionViewerDate, "What would you like to reflect on?")}
                </div>
              </div>
              <div style={{ marginTop: 9, whiteSpace: "pre-wrap", lineHeight: 1.6, color: "#5B4B6B", padding: 13, borderRadius: 12, background: "#FFF8FD", border: "1px solid #E8CCE8" }}>
                {reflectionViewerLoading ? "Loading your reflection…" : reflectionViewerNote || "No reflection was saved for this day."}
              </div>
            </div>
          </ToolPanel>
  );
}

export function DailyJournalPanel({ open, onClose, dailyJournalPromptOpen, journalQuickOpenDate, journalDisplayedPrompt, privateNoteEditing, setPrivateNoteEditing, privateNoteDraft, setPrivateNoteDraft, savePrivateNote, privateNote, privateNoteMessage }) {
  if (!open) return null;
  return (
          <ToolPanel title={dailyJournalPromptOpen ? "Your daily PlushJournal prompt" : "PlushJournal"} onClose={onClose}>
            <div style={{ padding: "15px 16px", borderRadius: 16, background: "rgba(255,255,255,0.28)", border: "1px solid #E6D4F2" }}>
              <div style={{ marginBottom: 4, fontSize: 10.5, letterSpacing: "0.1em", fontWeight: 900, color: "#A65DC1" }}>JOURNAL FOR {new Date(`${journalQuickOpenDate}T12:00:00Z`).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }).toUpperCase()}</div>
              <div style={{ fontStyle: "italic", lineHeight: 1.5, fontSize: 12.5, color: "#8C6B9E" }}>{journalDisplayedPrompt}</div>
              {privateNoteEditing ? <>
                <textarea value={privateNoteDraft} onChange={(event) => setPrivateNoteDraft(event.target.value)} maxLength={5000} aria-label="Private reflection" placeholder="Only you can read this." style={{ width: "100%", boxSizing: "border-box", minHeight: 120, marginTop: 8, padding: 10, borderRadius: 10, border: "1px solid #D9B8E8", resize: "vertical" }} />
                <div style={{ display: "flex", gap: 7, marginTop: 7 }}>
                  <button type="button" onClick={savePrivateNote} style={{ padding: "7px 11px", borderRadius: 9, border: 0, background: "#A65DC1", color: "white", fontWeight: 900, cursor: "pointer" }}>Save</button>
                  <button type="button" onClick={() => setPrivateNoteEditing(false)} style={{ padding: "7px 11px", borderRadius: 9, border: "1px solid #D9B8E8", background: "white", color: "#8E4EAA", fontWeight: 800, cursor: "pointer" }}>Cancel</button>
                </div>
              </> : (
                <>
                  <div style={{ marginTop: 9, whiteSpace: "pre-wrap", lineHeight: 1.6, fontSize: 13, color: privateNote ? "#5B4B6B" : "#9A86A7" }}>{privateNote || "Nothing written for this day yet — only you can ever read it."}</div>
                  <button type="button" onClick={() => setPrivateNoteEditing(true)} style={{ marginTop: 10, padding: "7px 11px", borderRadius: 9, border: "1px solid #D9B8E8", background: "white", color: "#8E4EAA", fontWeight: 900, fontSize: 12, cursor: "pointer" }}>{privateNote ? "Edit" : "Add one"}</button>
                </>
              )}
              {privateNoteMessage && <div role="status" aria-live="polite" style={{ marginTop: 8, fontSize: 11.5, color: "#8C6B9E" }}>{privateNoteMessage}</div>}
            </div>
          </ToolPanel>
  );
}
