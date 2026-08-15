// The PlushCare dashboard tab — module split phase 7, ninth slice
// (see docs/module-split-plan.md). First of the always-in-tree
// dashboard views (not a ToolPanel — switched via `dashboard === "x"`,
// no onClose). Quick comfort tools, PlushPaths, PlushSleep +
// soundscapes, and (for the one profile that has it) Mama's Corner.
// COMFORT_TOOLS/PLUSH_PATHS/SLEEP_TOOLS/SOUNDSCAPES/GENTLE_AFFIRMATIONS
// read from window.PlushLifeContent; pathOfTheWeekId from
// window.PlushLifeSchedule — both inside this file. MamasCorner
// imported directly from ./baby-mode.jsx (already its own module,
// phase 6). HELP_ME_NOW_OPTIONS passed as a prop since it's a plain
// literal in app-source.jsx, not a window global.
import { MamasCorner } from "./baby-mode.jsx";

export function CarePanel({ open, babyMode, setCheckInPopupOpen, babyCaregiverName, careSituationsExpanded, setCareSituationsExpanded, setCareMessage, openCareSession, careMessage, isMamaCornerProfile, careExtraSupportOpen, setCareExtraSupportOpen, user, preferences, rows, viewDone, toggle, supabase, careSection, setCareSection, careSessionHistory, HELP_ME_NOW_OPTIONS, pathProgress, setSelectedCarePath, period, setSleepToolOpen, soundscapePlaying, toggleSoundscape, soundscapeVolume, changeSoundscapeVolume, setSoundscapeSleepTimer, soundscapeTimerMinutes }) {
  if (!open) return null;
  const { COMFORT_TOOLS, PLUSH_PATHS, SLEEP_TOOLS, SOUNDSCAPES, GENTLE_AFFIRMATIONS } = window.PlushLifeContent;
  const { pathOfTheWeekId } = window.PlushLifeSchedule;
  return (
          <div style={{ marginBottom: 18, display: "grid", gap: 14 }}>
            <div style={{ padding: 18, borderRadius: 20, background: "linear-gradient(145deg,#F2FFFB,#FFF7FC)", border: "1px solid #BFE5D2", boxShadow: "0 8px 24px rgba(49,140,121,.09)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
                <div><div style={{ fontSize: 11, letterSpacing: ".15em", color: "#318C79", fontWeight: 900 }}>{babyMode ? "🧸 LITTLE COMFORT CORNER" : "♥ PLUSHCARE"}</div><div style={{ marginTop: 4, fontSize: 20, color: "#4F405C", fontWeight: 900 }}>{babyMode ? "What does my little self need?" : "What would help right now?"}</div></div>
                <button type="button" onClick={() => setCheckInPopupOpen(true)} style={{ padding: "7px 10px", borderRadius: 10, border: "1px solid #73B7A8", background: "white", color: "#318C79", fontWeight: 900, fontSize: 11.5, cursor: "pointer" }}>{babyMode ? `${babyCaregiverName} Check-In` : "Update check-in"}</button>
              </div>
              <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.5, color: "#607A73" }}>{babyMode ? "Pick a feeling, and we will make everything smaller and softer together." : "Choose what is happening. PlushLife will offer one short tool and one realistic next step."}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 8, marginTop: 12 }}>
                {HELP_ME_NOW_OPTIONS.slice(0, careSituationsExpanded ? HELP_ME_NOW_OPTIONS.length : 4).map((option) => (
                  <button key={option.id} type="button" onClick={() => { setCareMessage(option.next); openCareSession(option.tool); }} style={{ padding: "11px 10px", borderRadius: 13, border: "1px solid #CFE8E1", background: "#FFFFFFD9", color: "#4F625D", textAlign: "left", fontWeight: 800, fontSize: 12, lineHeight: 1.35, cursor: "pointer" }}><span style={{ fontSize: 19, marginRight: 6 }}>{option.icon}</span>{option.label}</button>
                ))}
              </div>
              <button type="button" onClick={() => setCareSituationsExpanded((expanded) => !expanded)} aria-expanded={careSituationsExpanded} style={{ marginTop: 9, padding: "7px 10px", borderRadius: 9, border: "1px solid #73B7A8", background: "white", color: "#318C79", fontWeight: 900, fontSize: 11.5, cursor: "pointer" }}>{careSituationsExpanded ? "Show fewer situations" : "Show all situations"}</button>
              {careMessage && <div aria-live="polite" style={{ marginTop: 10, padding: "9px 11px", borderRadius: 10, background: "#FFFFFFB8", color: "#5E766F", fontSize: 11.5, lineHeight: 1.5 }}>{careMessage}</div>}
            </div>

            {isMamaCornerProfile && (
            <details open={careExtraSupportOpen} onToggle={(event) => setCareExtraSupportOpen(event.currentTarget.open)} style={{ borderRadius: 14, border: "1px solid #E6D4F2", background: "#FFFFFF99", padding: "10px 12px" }}>
              <summary style={{ color: "#76558A", fontWeight: 900, fontSize: 12, cursor: "pointer" }}>More cozy support</summary>
              <div style={{ marginTop: 10, display: "grid", gap: 12 }}>
                <MamasCorner userId={user.id} caregiverName={babyCaregiverName} parentVoice={preferences.baby_voice === "fatherly" ? "fatherly" : "motherly"} incompleteTasks={rows.filter((row) => !viewDone[row.key] && !row.isBonus)} onConfirmTask={(taskKey) => toggle(taskKey)} supabase={supabase} />
              </div>
            </details>
            )}

            <div role="tablist" aria-label="Care library" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 7, padding: 6, borderRadius: 15, background: "#FFFFFF99", border: "1px solid #E6D4F2" }}>
              {[["quick", "🌿", "PlushCalm"], ["paths", "🗺️", "PlushPaths"], ["sleep", "🌙", "PlushSleep"]].map(([value, icon, label]) => (
                <button key={value} type="button" role="tab" aria-selected={careSection === value} onClick={() => setCareSection(value)} style={{ minWidth: 0, padding: "9px 6px", borderRadius: 11, border: careSection === value ? "2px solid #A65DC1" : "1px solid transparent", background: careSection === value ? "#F7ECFB" : "transparent", color: careSection === value ? "#75428C" : "#7B6888", fontWeight: 900, fontSize: 11.5, cursor: "pointer" }}>{icon} {label}</button>
              ))}
            </div>

            {careSection === "quick" && <div style={{ padding: 17, borderRadius: 20, background: "#FFFFFFB8", border: "1px solid #E6D4F2" }}>
              <div style={{ fontSize: 11, letterSpacing: ".14em", fontWeight: 900, color: "#A65DC1" }}>🌿 QUICK CARE SESSIONS</div>
              <div style={{ marginTop: 5, fontSize: 12, color: "#7B6888" }}>Short, private, and always free. Tell PlushLife afterward whether it helped.</div>
              {(() => {
                const helpful = careSessionHistory.find((entry) => ["helped", "a_little"].includes(entry.outcome));
                const tool = helpful && COMFORT_TOOLS.find((entry) => entry.id === helpful.session_id);
                return tool ? <div style={{ marginTop: 9, padding: "8px 10px", borderRadius: 10, background: "#F2FFFB", color: "#4D746A", fontSize: 11.5 }}>You previously said <strong>{tool.name}</strong> helped. Want to use it again?</div> : null;
              })()}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 8, marginTop: 11 }}>
                {COMFORT_TOOLS.map((tool) => <button key={tool.id} type="button" onClick={() => openCareSession(tool.id)} style={{ padding: "12px 8px", borderRadius: 13, border: "1px solid #E3C9EC", background: "#FFF9FD", color: "#6B5A7D", fontWeight: 900, fontSize: 11.5, cursor: "pointer" }}><div style={{ fontSize: 23 }}>{tool.icon}</div><div style={{ marginTop: 4 }}>{tool.name}</div></button>)}
              </div>
            </div>}

            {careSection === "paths" && <div style={{ padding: 17, borderRadius: 20, background: "#FFFDF4D9", border: "1px solid #E9C96E" }}>
              <div style={{ fontSize: 11, letterSpacing: ".14em", fontWeight: 900, color: "#A56D14" }}>🗺️ PLUSHPATHS</div>
              <div style={{ marginTop: 5, fontSize: 12, color: "#7B6888" }}>Guided programs that move at your pace. Pause, repeat, or leave any time. One is featured each week — try it, or pick any other.</div>
              <div style={{ display: "grid", gap: 9, marginTop: 11 }}>
                {(() => {
                  const featuredId = pathOfTheWeekId(period.weekStart);
                  const ordered = [...PLUSH_PATHS].sort((a, b) => (a.id === featuredId ? -1 : b.id === featuredId ? 1 : 0));
                  return ordered.map((path) => {
                  const progress = pathProgress.find((item) => item.path_id === path.id);
                  const completedCount = progress?.completed_days?.length || 0;
                  const featured = path.id === featuredId;
                  return <button key={path.id} type="button" onClick={() => setSelectedCarePath(path.id)} style={{ width: "100%", padding: "12px", borderRadius: 13, border: featured ? "2px solid #D4A017" : "1px solid #F0D99E", background: "#FFFFFFD9", textAlign: "left", cursor: "pointer" }}>
                    {progress?.status === "paused" && <div style={{ marginBottom: 6, fontSize: 10.5, fontWeight: 900, letterSpacing: ".1em", color: "#9A6918" }}>⏸ PAUSED</div>}
                    {featured && progress?.status !== "paused" && <div style={{ marginBottom: 6, fontSize: 10.5, fontWeight: 900, letterSpacing: ".1em", color: "#A56D14" }}>🌟 FEATURED THIS WEEK</div>}
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}><span style={{ fontSize: 24 }}>{path.icon}</span><div style={{ minWidth: 0, flex: 1 }}><div style={{ fontWeight: 900, color: "#5B4B6B", fontSize: 13.5 }}>{path.title}</div><div style={{ marginTop: 2, color: "#8C6B9E", fontSize: 11.5, lineHeight: 1.4 }}>{path.description}</div></div><span style={{ fontSize: 11, fontWeight: 900, color: "#A56D14" }}>{completedCount}/{path.days.length}</span></div>
                    <div style={{ height: 6, marginTop: 9, borderRadius: 4, overflow: "hidden", background: "#F7EDCF" }}><div style={{ width: `${Math.round((completedCount / path.days.length) * 100)}%`, height: "100%", background: "#D4A017" }} /></div>
                  </button>;
                  });
                })()}
              </div>
            </div>}

            {careSection === "sleep" && (() => {
              const helpfulSleepEntry = careSessionHistory.find((entry) => entry.session_kind === "sleep" && ["helped", "a_little"].includes(entry.outcome));
              const helpfulSleepTool = helpfulSleepEntry && SLEEP_TOOLS.find((entry) => entry.id === helpfulSleepEntry.session_id);
              return <div style={{ position: "relative", padding: 17, borderRadius: 20, overflow: "hidden", background: "linear-gradient(160deg,#1B2245,#2E3A6B 55%,#1B2245)", border: "1px solid #3B4A85" }}>
                {["6%,10%", "18%,32%", "72%,14%", "88%,36%", "45%,6%", "60%,28%", "30%,20%"].map((position, index) => {
                  const [left, top] = position.split(",");
                  return <span key={index} aria-hidden="true" style={{ position: "absolute", left, top, fontSize: 10, color: "#C7D5F3", opacity: 0.8 }}>✦</span>;
                })}
                <div style={{ position: "relative", fontSize: 11, letterSpacing: ".14em", fontWeight: 900, color: "#93A9F5" }}>{babyMode ? "🌙 BEDTIME NEST" : "🌙 PLUSHSLEEP"}</div>
                <div style={{ position: "relative", marginTop: 5, fontSize: 12, color: "#C7D5F3" }}>{babyMode ? "A soft little landing for when it is time to get cozy and rest." : "Practical support for difficult nights—not a score and not a medical sleep assessment."}</div>
                {helpfulSleepTool && <div style={{ position: "relative", marginTop: 9, padding: "8px 10px", borderRadius: 10, background: "#2E3A6B99", color: "#DCE3FA", fontSize: 11.5 }}>You previously said <strong>{helpfulSleepTool.title}</strong> helped. Want to use it again?</div>}
                <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 8, marginTop: 11 }}>
                  {SLEEP_TOOLS.map((tool) => <button key={tool.id} type="button" onClick={() => setSleepToolOpen(tool.id)} style={{ padding: "11px 10px", borderRadius: 13, border: "1px solid #3B4A85", background: "#2E3A6B99", color: "#DCE3FA", textAlign: "left", fontWeight: 800, fontSize: 12, cursor: "pointer" }}><span style={{ fontSize: 19, marginRight: 6 }}>{tool.icon}</span>{tool.title}</button>)}
                </div>

                <div style={{ position: "relative", marginTop: 14, paddingTop: 13, borderTop: "1px solid #3B4A85" }}>
                  <div style={{ fontSize: 11, letterSpacing: ".14em", fontWeight: 900, color: "#93A9F5" }}>🎧 SOUNDSCAPES</div>
                  <div style={{ marginTop: 4, fontSize: 11.5, color: "#C7D5F3" }}>Gentle background sound for winding down. Keeps playing while you do other things.</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(100px,1fr))", gap: 8, marginTop: 10 }}>
                    {SOUNDSCAPES.map((sound) => {
                      const active = soundscapePlaying === sound.id;
                      return (
                        <button key={sound.id} type="button" data-plushlife-soundscape-id={sound.id} onClick={() => toggleSoundscape(sound.id)} style={{ padding: "10px 8px", borderRadius: 12, border: active ? "2px solid #93A9F5" : "1px solid #3B4A85", background: active ? "#93A9F533" : "#2E3A6B99", color: "#DCE3FA", textAlign: "center", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>
                          <div style={{ fontSize: 20 }}>{sound.icon}</div>
                          <div style={{ marginTop: 3 }}>{active ? "⏸ Playing" : sound.label}</div>
                        </button>
                      );
                    })}
                  </div>
                  {soundscapePlaying && (
                    <div style={{ marginTop: 10 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: "#C7D5F3" }}>
                        Volume
                        <input type="range" min="0" max="1" step="0.05" value={soundscapeVolume} onChange={(event) => changeSoundscapeVolume(parseFloat(event.target.value))} style={{ flex: 1 }} />
                      </label>
                      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "#93A9F5", fontWeight: 800 }}>Stop after:</span>
                        {[15, 30, 60].map((minutes) => (
                          <button key={minutes} type="button" onClick={() => setSoundscapeSleepTimer(minutes)} style={{ padding: "4px 9px", borderRadius: 999, border: soundscapeTimerMinutes === minutes ? "2px solid #93A9F5" : "1px solid #3B4A85", background: soundscapeTimerMinutes === minutes ? "#93A9F533" : "transparent", color: "#DCE3FA", fontWeight: 800, fontSize: 11, cursor: "pointer" }}>{minutes}m</button>
                        ))}
                        <button type="button" onClick={() => setSoundscapeSleepTimer(null)} style={{ padding: "4px 9px", borderRadius: 999, border: !soundscapeTimerMinutes ? "2px solid #93A9F5" : "1px solid #3B4A85", background: !soundscapeTimerMinutes ? "#93A9F533" : "transparent", color: "#DCE3FA", fontWeight: 800, fontSize: 11, cursor: "pointer" }}>Off</button>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ position: "relative", marginTop: 14, paddingTop: 13, borderTop: "1px solid #3B4A85" }}>
                  <div style={{ fontSize: 11, letterSpacing: ".14em", fontWeight: 900, color: "#93A9F5" }}>✨ GENTLE REMINDER</div>
                  <div style={{ marginTop: 6, padding: "12px 14px", borderRadius: 14, background: "rgba(147, 169, 245, 0.12)", border: "1px dashed #4E5E9E", color: "#E0E7FD", fontSize: 13, fontStyle: "italic", lineHeight: 1.45, textAlign: "center" }}>
                    "{GENTLE_AFFIRMATIONS[Math.floor((new Date().getDate() + (new Date().getMonth() * 31)) % GENTLE_AFFIRMATIONS.length)]}"
                  </div>
                </div>
              </div>;
            })()}

          </div>
  );
}
