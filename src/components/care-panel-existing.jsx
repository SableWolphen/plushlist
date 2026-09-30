// Care tool library, with a short default path list and optional full browsing.
export function CarePanel({ open, babyMode, setCheckInPopupOpen, babyCaregiverName, careSituationsExpanded, setCareSituationsExpanded, setCareMessage, openCareSession, careMessage, libraryOnly = false, user, preferences, rows, viewDone, toggle, supabase, careSection, setCareSection, careSessionHistory, HELP_ME_NOW_OPTIONS, pathProgress, setSelectedCarePath, period, setSleepToolOpen, soundscapePlaying, toggleSoundscape, soundscapeVolume, changeSoundscapeVolume, setSoundscapeSleepTimer, soundscapeTimerMinutes }) {
  const [allPaths, setAllPaths] = React.useState(false);
  if (!open) return null;
  const { COMFORT_TOOLS, PLUSH_PATHS, SLEEP_TOOLS, SOUNDSCAPES, GENTLE_AFFIRMATIONS } = window.PlushLifeContent;
  const { pathOfTheWeekId } = window.PlushLifeSchedule;
  return (
          <div style={{ marginBottom: 18, display: "grid", gap: 14 }}>
            {!libraryOnly && (
            <div style={{ padding: 18, borderRadius: 20, background: "var(--pl-theme-surface)", border: "1px solid var(--pl-theme-line,#E9DDF6)", boxShadow: "0 8px 24px rgba(49,140,121,.09)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, flexWrap: "wrap" }}>
                <div><div style={{ fontSize: 11, letterSpacing: ".15em", color: "var(--pl-theme-ink,#318C79)", fontWeight: 900 }}>{babyMode ? "🧸 LITTLE COMFORT CORNER" : "♥ PLUSHCARE"}</div><div style={{ marginTop: 4, fontSize: 20, color: "var(--pl-theme-ink,#4F405C)", fontWeight: 900 }}>{babyMode ? "What does my little self need?" : "What would help right now?"}</div></div>
                <button type="button" onClick={() => setCheckInPopupOpen(true)} style={{ padding: "7px 10px", borderRadius: 10, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "white", color: "var(--pl-theme-ink,#318C79)", fontWeight: 900, fontSize: 11.5, cursor: "pointer" }}>{babyMode ? `${babyCaregiverName} Check-In` : "Update check-in"}</button>
              </div>
              <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.5, color: "var(--pl-theme-ink,#607A73)" }}>{babyMode ? "Pick a feeling, and we will make everything smaller and softer together." : "Choose what is happening. PlushLife will offer one short tool and one realistic next step."}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 8, marginTop: 12 }}>
                {HELP_ME_NOW_OPTIONS.slice(0, careSituationsExpanded ? HELP_ME_NOW_OPTIONS.length : 4).map((option) => (
                  <button key={option.id} type="button" onClick={() => { setCareMessage(option.next); openCareSession(option.tool); }} style={{ padding: "11px 10px", borderRadius: 13, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "#FFFFFFD9", color: "var(--pl-theme-ink,#4F625D)", textAlign: "left", fontWeight: 800, fontSize: 12, lineHeight: 1.35, cursor: "pointer" }}><span style={{ fontSize: 19, marginRight: 6 }}>{option.icon}</span>{option.label}</button>
                ))}
              </div>
              <button type="button" onClick={() => setCareSituationsExpanded((expanded) => !expanded)} aria-expanded={careSituationsExpanded} style={{ marginTop: 9, padding: "7px 10px", borderRadius: 9, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "white", color: "var(--pl-theme-ink,#318C79)", fontWeight: 900, fontSize: 11.5, cursor: "pointer" }}>{careSituationsExpanded ? "Show fewer situations" : "Show all situations"}</button>
              {careMessage && <div aria-live="polite" style={{ marginTop: 10, padding: "9px 11px", borderRadius: 10, background: "#FFFFFFB8", color: "var(--pl-theme-ink,#5E766F)", fontSize: 11.5, lineHeight: 1.5 }}>{careMessage}</div>}
            </div>
            )}

            <div role="tablist" aria-label="Care library" style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 5, padding: 4, borderRadius: 13, background: "#FFFFFFB8", border: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
              {[["quick", "🌿", "PlushCalm"], ["paths", "🗺️", "PlushPaths"], ["sleep", "🌙", "PlushSleep"]].map(([value, icon, label]) => (
                <button key={value} type="button" role="tab" aria-selected={careSection === value} onClick={() => setCareSection(value)} style={{ minWidth: 0, padding: "7px 5px", minHeight: 38, borderRadius: 10, border: careSection === value ? "2px solid #C983D4" : "1px solid transparent", background: careSection === value ? "#FFF7FD" : "transparent", color: careSection === value ? "#75428C" : "#7B6888", fontWeight: 900, fontSize: 10.2, cursor: "pointer" }}>{icon} {label}</button>
              ))}
            </div>

            {careSection === "quick" && <div className="pl-care-library-panel" style={{ padding: 11, borderRadius: 16, background: "#FFFFFFC7", border: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
              <div style={{ fontSize: 9.8, letterSpacing: ".12em", fontWeight: 900, color: "var(--pl-theme-muted,#A65DC1)" }}>🌿 QUICK CARE SESSIONS</div>
              <div style={{ marginTop: 3, fontSize: 10.5, lineHeight: 1.35, color: "var(--pl-theme-muted,#7B6888)" }}>A little calm, whenever you need it.</div>
              {(() => {
                const helpful = careSessionHistory.find((entry) => ["helped", "a_little"].includes(entry.outcome));
                const tool = helpful && COMFORT_TOOLS.find((entry) => entry.id === helpful.session_id);
                return !libraryOnly && tool ? <div style={{ marginTop: 7, padding: "7px 9px", borderRadius: 10, background: "var(--pl-theme-surface,#F7FFFC)", color: "var(--pl-theme-ink,#5B746D)", fontSize: 10.2, lineHeight: 1.35 }}>You previously said <strong>{tool.name}</strong> helped. Want to use it again?</div> : null;
              })()}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 6, marginTop: 8 }}>
                {COMFORT_TOOLS.map((tool) => <button key={tool.id} className="pl-care-tool" type="button" onClick={() => openCareSession(tool.id)} style={{ minHeight: 64, padding: "8px 6px", borderRadius: 12, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface,#FFF9FD)", color: "var(--pl-theme-ink,#6B5A7D)", fontWeight: 900, fontSize: 10.2, cursor: "pointer" }}><div style={{ fontSize: 19 }}>{tool.icon}</div><div style={{ marginTop: 3, lineHeight: 1.2 }}>{tool.name}</div></button>)}
              </div>
            </div>}

            {careSection === "paths" && <div className="pl-care-library-panel" style={{ padding: 11, borderRadius: 16, background: "#FFFDF4D9", border: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
              <div style={{ fontSize: 11, letterSpacing: ".14em", fontWeight: 900, color: "var(--pl-theme-ink,#A56D14)" }}>🗺️ PLUSHPATHS</div>
              <div style={{ marginTop: 5, fontSize: 12, color: "var(--pl-theme-muted,#7B6888)" }}>One small step at a time. Pause whenever you need.</div>
              <div style={{ display: "grid", gap: 9, marginTop: 11 }}>
                {(() => {
                  const featuredId = pathOfTheWeekId(period.weekStart);
                  const ordered = [...PLUSH_PATHS].sort((a, b) => (a.id === featuredId ? -1 : b.id === featuredId ? 1 : 0));
                  return (allPaths ? ordered : ordered.slice(0, 3)).map((path) => {
                  const progress = pathProgress.find((item) => item.path_id === path.id);
                  const completedCount = progress?.completed_days?.length || 0;
                  const featured = path.id === featuredId;
                  return <button key={path.id} type="button" onClick={() => setSelectedCarePath(path.id)} style={{ width: "100%", padding: "12px", borderRadius: 13, border: featured ? "2px solid #D4A017" : "1px solid #F0D99E", background: "#FFFFFFD9", textAlign: "left", cursor: "pointer" }}>
                    {progress?.status === "paused" && <div style={{ marginBottom: 6, fontSize: 10.5, fontWeight: 900, letterSpacing: ".1em", color: "var(--pl-theme-ink,#9A6918)" }}>⏸ PAUSED</div>}
                    {featured && progress?.status !== "paused" && <div style={{ marginBottom: 6, fontSize: 10.5, fontWeight: 900, letterSpacing: ".1em", color: "var(--pl-theme-ink,#A56D14)" }}>🌟 FEATURED THIS WEEK</div>}
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}><span style={{ fontSize: 24 }}>{path.icon}</span><div style={{ minWidth: 0, flex: 1 }}><div style={{ fontWeight: 900, color: "var(--pl-theme-ink,#5B4B6B)", fontSize: 13.5 }}>{path.title}</div><div style={{ marginTop: 2, color: "var(--pl-theme-muted,#8C6B9E)", fontSize: 11.5, lineHeight: 1.4 }}>{path.description}</div></div><span style={{ fontSize: 11, fontWeight: 900, color: "var(--pl-theme-ink,#A56D14)" }}>{completedCount}/{path.days.length}</span></div>
                    <div style={{ height: 6, marginTop: 9, borderRadius: 4, overflow: "hidden", background: "var(--pl-theme-surface-2,#F7EDCF)" }}><div style={{ width: `${Math.round((completedCount / path.days.length) * 100)}%`, height: "100%", background: "var(--pl-theme-accent,#D4A017)" }} /></div>
                  </button>;
                  });
                })()}
              </div>
              {PLUSH_PATHS.length > 3 && <button type="button" className="pl-collection-more" aria-expanded={allPaths} onClick={() => setAllPaths(value => !value)}>{allPaths ? "Show fewer paths" : `Browse all ${PLUSH_PATHS.length} paths`}</button>}
            </div>}

            {careSection === "sleep" && (() => {
              const helpfulSleepEntry = careSessionHistory.find((entry) => entry.session_kind === "sleep" && ["helped", "a_little"].includes(entry.outcome));
              const helpfulSleepTool = helpfulSleepEntry && SLEEP_TOOLS.find((entry) => entry.id === helpfulSleepEntry.session_id);
              return <div className="pl-care-library-panel" style={{ position: "relative", padding: 11, borderRadius: 16, overflow: "hidden", background: "var(--pl-theme-surface)", border: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
                {["6%,10%", "18%,32%", "72%,14%", "88%,36%", "45%,6%", "60%,28%", "30%,20%"].map((position, index) => {
                  const [left, top] = position.split(",");
                  return <span key={index} aria-hidden="true" style={{ position: "absolute", left, top, fontSize: 10, color: "var(--pl-theme-muted,#C596D5)", opacity: 0.8 }}>✦</span>;
                })}
                <div style={{ position: "relative", fontSize: 11, letterSpacing: ".14em", fontWeight: 900, color: "var(--pl-theme-muted,#A15CB7)" }}>{babyMode ? "🌙 BEDTIME NEST" : "🌙 PLUSHSLEEP"}</div>
                <div style={{ position: "relative", marginTop: 5, fontSize: 12, color: "var(--pl-theme-muted,#796386)" }}>{babyMode ? "A soft little landing for when it is time to get cozy and rest." : "A softer landing for tonight."}</div>
                {helpfulSleepTool && <div style={{ position: "relative", marginTop: 9, padding: "8px 10px", borderRadius: 10, background: "var(--pl-theme-surface-2,#F5ECFA)", color: "var(--pl-theme-ink,#654D73)", fontSize: 11.5 }}>You previously said <strong>{helpfulSleepTool.title}</strong> helped. Want to use it again?</div>}
                <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 8, marginTop: 11 }}>
                  {SLEEP_TOOLS.map((tool) => <button key={tool.id} className="pl-care-tool" type="button" onClick={() => setSleepToolOpen(tool.id)} style={{ padding: "11px 10px", borderRadius: 13, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface-2,#F5ECFA)", color: "var(--pl-theme-ink,#654D73)", textAlign: "left", fontWeight: 800, fontSize: 12, cursor: "pointer" }}><span style={{ fontSize: 19, marginRight: 6 }}>{tool.icon}</span>{tool.title}</button>)}
                </div>

                <div style={{ position: "relative", marginTop: 14, paddingTop: 13, borderTop: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
                  <div style={{ fontSize: 11, letterSpacing: ".14em", fontWeight: 900, color: "var(--pl-theme-muted,#9158A3)" }}>🎧 SOUNDSCAPES</div>
                  <div style={{ marginTop: 4, fontSize: 11.5, color: "var(--pl-theme-muted,#796386)" }}>Gentle background sound for winding down. Keeps playing while you do other things.</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(100px,1fr))", gap: 8, marginTop: 10 }}>
                    {SOUNDSCAPES.map((sound) => {
                      const active = soundscapePlaying === sound.id;
                      return (
                        <button key={sound.id} type="button" data-plushlife-soundscape-id={sound.id} onClick={() => toggleSoundscape(sound.id)} style={{ padding: "10px 8px", borderRadius: 12, border: active ? "2px solid #BD77CE" : "1px solid #DDC8EA", background: active ? "#EDDCF6" : "#FFF9FD", color: "var(--pl-theme-ink,#654D73)", textAlign: "center", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>
                          <div style={{ fontSize: 20 }}>{sound.icon}</div>
                          <div style={{ marginTop: 3 }}>{active ? "⏸ Playing" : sound.label}</div>
                        </button>
                      );
                    })}
                  </div>
                  {soundscapePlaying && (
                    <div style={{ marginTop: 10 }}>
                      <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: "var(--pl-theme-muted,#796386)" }}>
                        Volume
                        <input type="range" min="0" max="1" step="0.05" value={soundscapeVolume} onChange={(event) => changeSoundscapeVolume(parseFloat(event.target.value))} style={{ flex: 1 }} />
                      </label>
                      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{ fontSize: 11, color: "var(--pl-theme-muted,#9158A3)", fontWeight: 800 }}>Stop after:</span>
                        {[15, 30, 60].map((minutes) => (
                          <button key={minutes} type="button" onClick={() => setSoundscapeSleepTimer(minutes)} style={{ padding: "4px 9px", borderRadius: 999, border: soundscapeTimerMinutes === minutes ? "2px solid #BD77CE" : "1px solid #DDC8EA", background: soundscapeTimerMinutes === minutes ? "#93A9F533" : "transparent", color: "var(--pl-theme-ink,#654D73)", fontWeight: 800, fontSize: 11, cursor: "pointer" }}>{minutes}m</button>
                        ))}
                        <button type="button" onClick={() => setSoundscapeSleepTimer(null)} style={{ padding: "4px 9px", borderRadius: 999, border: !soundscapeTimerMinutes ? "2px solid #BD77CE" : "1px solid #DDC8EA", background: !soundscapeTimerMinutes ? "#93A9F533" : "transparent", color: "var(--pl-theme-ink,#654D73)", fontWeight: 800, fontSize: 11, cursor: "pointer" }}>Off</button>
                      </div>
                    </div>
                  )}
                </div>
                <div style={{ position: "relative", marginTop: 14, paddingTop: 13, borderTop: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
                  <div style={{ fontSize: 11, letterSpacing: ".14em", fontWeight: 900, color: "var(--pl-theme-muted,#9158A3)" }}>✨ GENTLE REMINDER</div>
                  <div style={{ marginTop: 6, padding: "12px 14px", borderRadius: 14, background: "rgba(147, 169, 245, 0.12)", border: "1px dashed var(--pl-theme-line,#E9DDF6)", color: "var(--pl-theme-muted,#796386)", fontSize: 13, fontStyle: "italic", lineHeight: 1.45, textAlign: "center" }}>
                    "{GENTLE_AFFIRMATIONS[Math.floor((new Date().getDate() + (new Date().getMonth() * 31)) % GENTLE_AFFIRMATIONS.length)]}"
                  </div>
                </div>
              </div>;
            })()}

          </div>
  );
}
