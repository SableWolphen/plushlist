// The Settings ToolPanel — module split phase 7, sixth slice, second
// of the "big four" (see docs/module-split-plan.md). Watch pairing,
// local sync, home-screen widget sync, profile name/comfort item,
// appearance/theme, notifications, rest days, experience toggles,
// feedback, data export/restore/deletion, and account management.
// APPEARANCE_THEMES is read from window.PlushLifeContent, same as
// app-source.jsx itself.
import { ToolPanel } from "./shared.jsx";

export function SettingsPanel({ open, onClose, watchPairingCode, setWatchPairingCode, connectWatch, watchPairingBusy, watchPairingMessage, localWatchSyncBusy, startLocalWatchSync, localWatchSyncMessage, dailyCheckIn, pct, rows, viewDone, weeklyOverallPct, widgetSyncMsg, setWidgetSyncMsg, displayNameDraft, setDisplayNameDraft, saveDisplayName, comfortItemDraft, setComfortItemDraft, saveComfortItem, preferences, appearanceTheme, selectAppearanceTheme, dinoTheme, updatePreference, enableNotifications, smartReminderSuggestion, restDatesSet, toggleRestToday, period, restRangeDraft, setRestRangeDraft, saveRestRange, restDates, savePreferences, feedbackText, setFeedbackText, submitFeedback, feedbackMessage, exportMyData, restoreFileInputRef, restoreFromBackup, deleteAllCheckIns, deleteAllReflections, user, online, syncStatus, lastSyncedAt, syncNow, emailChangeDraft, setEmailChangeDraft, requestEmailChange, signingOut, handleSignOut, signOutOtherDevices, deleteMyAccount, settingsMessage }) {
  if (!open) return null;
  const { APPEARANCE_THEMES } = window.PlushLifeContent;
  return (
          <ToolPanel title="Settings" onClose={onClose}>

          <div style={{ marginBottom: 14, padding: 16, borderRadius: 18, background: "#F2FFFB", border: "1px solid #B9E5D9" }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#318C79" }}>⌚ CONNECT WATCH</div>
            <div style={{ marginTop: 4, fontSize: 11.5, lineHeight: 1.45, color: "#6B7C78" }}>Open PlushLife on your Amazfit watch, choose <b>My tasks</b>, then enter the code it shows. You must be signed in here first.</div>
            <div style={{ display: "flex", gap: 7, marginTop: 10, flexWrap: "wrap" }}>
              <input type="text" value={watchPairingCode} onChange={(event) => setWatchPairingCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))} onKeyDown={(event) => { if (event.key === "Enter") connectWatch(); }} inputMode="text" autoCapitalize="characters" maxLength={8} placeholder="8-character code" aria-label="Watch pairing code" style={{ flex: "1 1 160px", minWidth: 0, padding: 10, borderRadius: 9, border: "1px solid #9ED7C8", fontWeight: 900, letterSpacing: "0.12em", textTransform: "uppercase" }} />
              <button type="button" disabled={watchPairingBusy} onClick={connectWatch} style={{ padding: "9px 13px", borderRadius: 9, border: 0, background: watchPairingBusy ? "#91BEB2" : "#318C79", color: "white", fontWeight: 900, cursor: watchPairingBusy ? "wait" : "pointer" }}>{watchPairingBusy ? "Connecting…" : "Connect"}</button>
            </div>
            {watchPairingMessage && <div role="status" style={{ marginTop: 8, fontSize: 11.5, lineHeight: 1.4, color: watchPairingMessage.startsWith("Your watch") ? "#21705F" : "#8C6B9E", fontWeight: 700 }}>{watchPairingMessage}</div>}
            <div style={{ marginTop: 7, fontSize: 10.5, lineHeight: 1.4, color: "#6B7C78" }}>If you do not have a PlushLife account yet, create one on this phone first. Your account password is never sent to the watch.</div>
          </div>

          {window.Capacitor?.isNativePlatform?.() && window.Capacitor?.Plugins?.WatchSyncBridge && (
            <div style={{ marginBottom: 14, padding: 16, borderRadius: 18, background: "#F2FFFB", border: "1px solid #B9E5D9" }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#318C79" }}>⚡ INSTANT LOCAL SYNC (THIS PHONE)</div>
              <div style={{ marginTop: 4, fontSize: 11.5, lineHeight: 1.45, color: "#6B7C78" }}>Optional. Once enabled, a task tick on your watch updates this phone the moment it happens, over Bluetooth only — no code to enter, no internet needed for the tap itself. Your watch still falls back to the normal connection above whenever this phone app isn't running.</div>
              <button type="button" disabled={localWatchSyncBusy} onClick={startLocalWatchSync} style={{ marginTop: 10, padding: "9px 13px", borderRadius: 9, border: 0, background: localWatchSyncBusy ? "#91BEB2" : "#318C79", color: "white", fontWeight: 900, cursor: localWatchSyncBusy ? "wait" : "pointer" }}>{localWatchSyncBusy ? "Waiting for watch…" : "Enable instant local sync"}</button>
              {localWatchSyncMessage && <div role="status" style={{ marginTop: 8, fontSize: 11.5, lineHeight: 1.4, color: "#8C6B9E", fontWeight: 700 }}>{localWatchSyncMessage}</div>}
            </div>
          )}

          <div style={{ marginBottom: 14, padding: 16, borderRadius: 18, background: "linear-gradient(145deg, #FFF8FD, #F4EEFF 60%, #EDF9FF)", border: "1px solid #E3C9EC", boxShadow: "0 6px 18px rgba(166,93,193,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#8E4EAA" }}>📱 HOME SCREEN WIDGET</div>
              <span style={{ fontSize: 10.5, fontWeight: 800, padding: "3px 8px", borderRadius: 999, background: "#E8D5F0", color: "#7B3E96" }}>Android & Web</span>
            </div>
            <div style={{ marginTop: 4, fontSize: 11.5, lineHeight: 1.45, color: "#7A6485" }}>
              Keep your daily care steps and progress right on your phone's home screen.
            </div>

            <div style={{ marginTop: 12, padding: 14, borderRadius: 18, background: "#FFF8FC", border: "1px solid #E3C9EC", boxShadow: "0 4px 12px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: "#8E4EAA" }}>PlushLife 🌸</span>
                <span style={{ fontSize: 10, fontWeight: 900, color: "#A65DC1", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  {(dailyCheckIn.day_type || "full")} day · {pct}%
                </span>
              </div>

              {rows.slice(0, 4).length > 0 ? (
                <div style={{ display: "grid", gap: 5, marginBottom: 10 }}>
                  {rows.slice(0, 4).map((r) => {
                    const done = !!viewDone[r.key];
                    return (
                      <div key={r.key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: done ? "#8C7A97" : "#5B4B6B", textDecoration: done ? "line-through" : "none", fontWeight: 700 }}>
                        <span style={{ color: done ? "#3A9B7A" : "#B783CD", fontWeight: 900 }}>{done ? "✓" : "○"}</span>
                        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{r.label}</span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ fontSize: 12, fontWeight: 800, color: "#5B4B6B", marginBottom: 10 }}>
                  {dailyCheckIn.day_type === "rest" ? "Resting counts today 🌸" : "Open PlushLife for one caring step 💕"}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, paddingTop: 8, borderTop: "1px solid #F0E3F3" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, fontWeight: 900, color: "#8C6B9E", marginBottom: 3 }}>
                    <span>TODAY</span>
                    <span style={{ color: "#A65DC1" }}>{pct}%</span>
                  </div>
                  <div style={{ height: 6, width: "100%", background: "#EADCF0", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: "#A65DC1", borderRadius: 999, transition: "width 0.3s ease" }} />
                  </div>
                </div>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 9.5, fontWeight: 900, color: "#8C6B9E", marginBottom: 3 }}>
                    <span>WEEK</span>
                    <span style={{ color: "#4C8FE8" }}>{weeklyOverallPct}%</span>
                  </div>
                  <div style={{ height: 6, width: "100%", background: "#DCE9FA", borderRadius: 999, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${weeklyOverallPct}%`, background: "#4C8FE8", borderRadius: 999, transition: "width 0.3s ease" }} />
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap", alignItems: "center" }}>
              <button
                type="button"
                onClick={() => {
                  document.dispatchEvent(new CustomEvent("plushlife-widget-sync"));
                  const WidgetBridge = window.Capacitor?.Plugins?.WidgetBridge;
                  if (WidgetBridge) {
                    const nextTask = rows.find((row) => !row.isBonus && !viewDone[row.key]) || rows.find((row) => !row.isBonus);
                    WidgetBridge.updateWidget({
                      nextTask: dailyCheckIn.day_type === "rest" ? "Resting counts today" : (nextTask?.label || "Today's caring steps are complete"),
                      dayType: `${(dailyCheckIn.day_type || "full").replace(/^./, (letter) => letter.toUpperCase())} Day · ${pct}%`,
                      progress: pct,
                      weeklyProgress: weeklyOverallPct,
                      tasks: rows.slice(0, 4).map((row) => ({ label: row.label, done: !!viewDone[row.key] })),
                    }).catch(() => {});
                  }
                  setWidgetSyncMsg("Widget synced! 💕");
                  setTimeout(() => setWidgetSyncMsg(""), 3000);
                }}
                style={{ padding: "8px 13px", borderRadius: 10, border: 0, background: "#8E4EAA", color: "white", fontWeight: 900, fontSize: 11.5, cursor: "pointer" }}
              >
                🔄 Sync Widget Now
              </button>
              {widgetSyncMsg && <span style={{ fontSize: 11.5, fontWeight: 800, color: "#3A9B7A" }}>{widgetSyncMsg}</span>}
            </div>

            <div style={{ marginTop: 10, padding: 10, borderRadius: 11, background: "rgba(255,255,255,0.7)", fontSize: 10.5, lineHeight: 1.45, color: "#7B6888" }}>
              <strong>How to add to Android Home Screen:</strong><br/>
              1. Long-press an empty space on your phone home screen.<br/>
              2. Tap <strong>Widgets</strong> and scroll to <strong>PlushLife</strong>.<br/>
              3. Drag the widget to your home screen!
            </div>
          </div>

          <div style={{ marginBottom: 14, padding: 16, borderRadius: 18, background: "#FFF8FD", border: "1px solid #E8CCE8" }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#8E4EAA" }}>🧸 PROFILE</div>
            <label style={{ display: "grid", gap: 5, marginTop: 10, fontSize: 11, fontWeight: 900, color: "#8E4EAA" }}>
              WHAT NAME SHOULD MY PLUSHLIFE USE?
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                <input type="text" value={displayNameDraft} onChange={(event) => setDisplayNameDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") saveDisplayName(); }} maxLength={40} placeholder="Example: Sable" aria-label="PlushLife display name" style={{ flex: "1 1 170px", minWidth: 0, padding: 9, borderRadius: 9, border: "1px solid #DDBCE7" }} />
                <button type="button" onClick={saveDisplayName} style={{ padding: "8px 11px", borderRadius: 9, border: 0, background: "#A65DC1", color: "white", fontWeight: 900, cursor: "pointer" }}>Save name</button>
              </div>
            </label>
            <div style={{ marginTop: 4, fontSize: 10.5, color: "#8C6B9E" }}>Your heading will read "{displayNameDraft.trim() || "Name"}'s PlushLife."</div>

            <label style={{ display: "grid", gap: 5, marginTop: 12, fontSize: 11, fontWeight: 900, color: "#8E6A37" }}>
              COMFORT ITEM · OPTIONAL
              <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
                <input type="text" value={comfortItemDraft} onChange={(event) => setComfortItemDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") saveComfortItem(); }} maxLength={80} placeholder="Example: favorite plush" aria-label="Comfort item name" style={{ flex: "1 1 170px", minWidth: 0, padding: 9, borderRadius: 9, border: "1px solid #E8D4B6" }} />
                <button type="button" onClick={saveComfortItem} style={{ padding: "8px 11px", borderRadius: 9, border: 0, background: "#C9954A", color: "white", fontWeight: 900, cursor: "pointer" }}>Save item</button>
              </div>
            </label>
            <div style={{ marginTop: 4, fontSize: 10.5, color: "#8C6B9E" }}>Use a name, or leave it blank for neutral comfort wording.</div>
          </div>

          <div style={{ marginBottom: 14, padding: 16, borderRadius: 18, background: preferences.nickname_style === "baby" ? "linear-gradient(145deg,#FFF0FA,#EAF8FF 55%,#FFF8D9)" : "#FFF9FD", border: preferences.nickname_style === "baby" ? "2px solid #D889E7" : "1px solid #E8CCE8", boxShadow: preferences.nickname_style === "baby" ? "0 8px 24px rgba(166,93,193,.16)" : "none" }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#8E4EAA" }}>🎨 APPEARANCE</div>
            <div style={{ marginTop: 12, fontSize: 10.5, fontWeight: 900, color: "#8E4EAA" }}>AMBIENT THEME</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 7, marginTop: 7 }}>
              {APPEARANCE_THEMES.map((theme) => {
                const selected = appearanceTheme === theme.id;
                return <button key={theme.id} type="button" aria-pressed={selected} onClick={() => selectAppearanceTheme(theme.id)} style={{ minWidth: 0, padding: "8px 4px", borderRadius: 10, border: selected ? "2px solid #A65DC1" : "1px solid #E3C9EC", background: selected ? "#F7ECFB" : "white", color: "#76558A", fontSize: 10.5, fontWeight: 900, cursor: "pointer" }}>{theme.icon} {theme.label}</button>;
              })}
            </div>
            <div style={{ marginTop: 5, fontSize: 10.5, lineHeight: 1.4, color: "#8C6B9E" }}>Saved privately on this device. It only changes PlushLife’s background mood.</div>
            <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, fontSize: 14, fontWeight: 900, color: "#8E4EAA", cursor: "pointer" }}>
              <input type="checkbox" checked={preferences.nickname_style === "baby"} onChange={(event) => updatePreference({ nickname_style: event.target.checked ? "baby" : "warm", dino_theme: event.target.checked ? false : preferences.dino_theme })} />
              🍼 Baby Mode
            </label>
            <div style={{ marginTop: 6, fontSize: 11.5, lineHeight: 1.5, color: "#7B6888" }}>Bigger words, round pill buttons, candy-soft colors, teddy-and-bottle decorations. Changes only the look — not your tasks, privacy, or progress.</div>
            {preferences.nickname_style === "baby" && (
              <div style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10.5, fontWeight: 900, color: "#8E4EAA" }}>VOICE</div>
                <div style={{ display: "flex", gap: 7, marginTop: 6 }}>
                  <button type="button" onClick={() => updatePreference({ baby_voice: "motherly" })} aria-pressed={(preferences.baby_voice || "motherly") === "motherly"} style={{ flex: 1, padding: "8px 10px", borderRadius: 10, border: (preferences.baby_voice || "motherly") === "motherly" ? "2px solid #A65DC1" : "1px solid #E3C9EC", background: (preferences.baby_voice || "motherly") === "motherly" ? "#F7ECFB" : "white", color: "#8E4EAA", fontWeight: 800, cursor: "pointer" }}>👩 Motherly</button>
                  <button type="button" onClick={() => updatePreference({ baby_voice: "fatherly" })} aria-pressed={preferences.baby_voice === "fatherly"} style={{ flex: 1, padding: "8px 10px", borderRadius: 10, border: preferences.baby_voice === "fatherly" ? "2px solid #4C8FE8" : "1px solid #E3C9EC", background: preferences.baby_voice === "fatherly" ? "#EAF4FF" : "white", color: "#4C8FE8", fontWeight: 800, cursor: "pointer" }}>👨 Fatherly</button>
                </div>
              </div>
            )}

            <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, fontSize: 14, fontWeight: 900, color: "#477F6D", cursor: "pointer" }}>
              <input type="checkbox" checked={dinoTheme} onChange={(event) => updatePreference({ dino_theme: event.target.checked, nickname_style: event.target.checked ? "warm" : preferences.nickname_style })} />
              🦕 Dino Theme
            </label>
            <div style={{ marginTop: 6, fontSize: 11.5, lineHeight: 1.5, color: "#7B6888" }}>Friendly dinosaur decorations on the cozy color theme. Changes only the look.</div>
          </div>

          <div style={{ marginBottom: 14, padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.82)", border: "1px solid #CFE8E1" }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#318C79" }}>🔔 PLUSHREMINDERS</div>
            <div style={{ marginTop: 4, fontSize: 11.5, lineHeight: 1.45, color: "#8C6B9E" }}>Push notifications work even while PlushLife is closed. Tap below to turn them on for this device.</div>
            <button onClick={enableNotifications} style={{ marginTop: 9, padding: "10px 14px", borderRadius: 10, border: 0, background: "#318C79", color: "white", fontWeight: 900, cursor: "pointer" }}>🔔 Enable push notifications</button>

            <div style={{ marginTop: 13, fontSize: 11, fontWeight: 900, color: "#6D5A7C" }}>CHECK-IN TIMES</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 7, marginTop: 7 }}>
              {preferences.reminder_times.map((time, index) => (
                <div key={index} style={{ display: "grid", gap: 3, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10.5, fontWeight: 900, color: "#6D5A7C" }}>REMINDER {index + 1}</span>
                    {preferences.reminder_times.length > 1 && (
                      <button type="button" onClick={() => updatePreference({ reminder_times: preferences.reminder_times.filter((_, itemIndex) => itemIndex !== index) })} aria-label={`Remove reminder ${index + 1}`} style={{ padding: "1px 6px", borderRadius: 7, border: "1px solid #E4C2C9", background: "#FFF8F9", color: "#B0576B", fontWeight: 900, fontSize: 10.5, cursor: "pointer" }}>✕</button>
                    )}
                  </div>
                  <input aria-label={`Reminder ${index + 1}`} type="time" value={time} onChange={(event) => updatePreference({ reminder_times: preferences.reminder_times.map((item, itemIndex) => itemIndex === index ? event.target.value : item) })} style={{ minWidth: 0, width: "100%", boxSizing: "border-box", padding: 9, borderRadius: 9, border: "1px solid #CFE8E1" }} />
                </div>
              ))}
            </div>
            {preferences.reminder_times.length < 8 && (
              <button type="button" onClick={() => updatePreference({ reminder_times: [...preferences.reminder_times, "12:00"] })} style={{ marginTop: 8, padding: "6px 10px", borderRadius: 9, border: "1px solid #CFE8E1", background: "white", color: "#318C79", fontWeight: 800, fontSize: 11.5, cursor: "pointer" }}>＋ Add another reminder time</button>
            )}
            {smartReminderSuggestion && preferences.reminder_times.length < 8 && (
              <div style={{ marginTop: 9, padding: "9px 10px", borderRadius: 10, background: "#F1FFF9", border: "1px solid #BFE5D2", fontSize: 11.5, lineHeight: 1.5, color: "#2F6E48" }}>
                💡 You tend to check in around <strong>{smartReminderSuggestion.label}</strong> — want a reminder around then?
                <div style={{ display: "flex", gap: 7, marginTop: 8 }}>
                  <button type="button" onClick={() => updatePreference({ reminder_times: [...preferences.reminder_times, smartReminderSuggestion.suggestedTime] })} style={{ padding: "6px 10px", borderRadius: 8, border: 0, background: "#318C79", color: "white", fontWeight: 900, fontSize: 11, cursor: "pointer" }}>Add it</button>
                  <button type="button" onClick={() => updatePreference({ smart_reminder_hint_dismissed_at: new Date().toISOString() })} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #A9DFC4", background: "white", color: "#2F6E48", fontWeight: 800, fontSize: 11, cursor: "pointer" }}>No thanks</button>
                </div>
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginTop: 7 }}>
              <label style={{ fontSize: 11.5, fontWeight: 800 }}>Quiet starts<input type="time" value={preferences.quiet_start} onChange={(event) => updatePreference({ quiet_start: event.target.value })} style={{ width: "100%", boxSizing: "border-box", marginTop: 4, padding: 8, borderRadius: 9, border: "1px solid #CFE8E1" }} /></label>
              <label style={{ fontSize: 11.5, fontWeight: 800 }}>Quiet ends<input type="time" value={preferences.quiet_end} onChange={(event) => updatePreference({ quiet_end: event.target.value })} style={{ width: "100%", boxSizing: "border-box", marginTop: 4, padding: 8, borderRadius: 9, border: "1px solid #CFE8E1" }} /></label>
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, fontSize: 12.5, fontWeight: 700 }}>
              <input type="checkbox" checked={!!preferences.discreet_notifications} onChange={(event) => updatePreference({ discreet_notifications: event.target.checked })} />
              Use discreet lock-screen wording (also skips guardian note previews)
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8, fontSize: 12.5, fontWeight: 700 }}>
              <input type="checkbox" checked={!!preferences.nurturing_checkins} onChange={(event) => updatePreference({ nurturing_checkins: event.target.checked })} />
              Show nurturing check-ins
            </label>
            <div style={{ marginTop: 10, fontSize: 10.5, color: "#8C6B9E" }}>After enabling, this device can receive check-ins and guardian notes even while PlushLife is closed.</div>
          </div>

          <div style={{ marginBottom: 14, padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.82)", border: "1px solid #CFE8E1" }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#318C79" }}>🌴 REST DAYS / VACATION MODE</div>
            <div style={{ marginTop: 4, fontSize: 11.5, lineHeight: 1.45, color: "#7B6888" }}>Plan ahead for a trip, illness, or any stretch of days. Rest days pause the list and reminders without erasing progress.</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, marginTop: 9, padding: "9px 11px", borderRadius: 10, background: "#F2FFFB", border: "1px solid #CFE8E1" }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: "#318C79" }}>Just resting today?</span>
              <button type="button" onClick={toggleRestToday} style={{ padding: "6px 10px", borderRadius: 999, border: restDatesSet.has(period.date) ? "2px solid #318C79" : "1px solid #D9B8E8", background: restDatesSet.has(period.date) ? "#E7F7EF" : "white", color: restDatesSet.has(period.date) ? "#318C79" : "#8E4EAA", fontWeight: 800, fontSize: 11.5, cursor: "pointer", flexShrink: 0 }}>{restDatesSet.has(period.date) ? "✓ Resting" : "Turn on"}</button>
            </div>
            <div style={{ display: "flex", gap: 7, marginTop: 9, flexWrap: "wrap", alignItems: "flex-end" }}>
              <label style={{ fontSize: 11, fontWeight: 800, color: "#318C79" }}>From<input type="date" value={restRangeDraft.start} onChange={(event) => setRestRangeDraft((current) => ({ ...current, start: event.target.value }))} style={{ display: "block", marginTop: 4, padding: 8, borderRadius: 9, border: "1px solid #CFE8E1" }} /></label>
              <label style={{ fontSize: 11, fontWeight: 800, color: "#318C79" }}>To<input type="date" value={restRangeDraft.end} onChange={(event) => setRestRangeDraft((current) => ({ ...current, end: event.target.value }))} style={{ display: "block", marginTop: 4, padding: 8, borderRadius: 9, border: "1px solid #CFE8E1" }} /></label>
              <button type="button" onClick={saveRestRange} style={{ padding: "8px 12px", borderRadius: 9, border: 0, background: "#318C79", color: "white", fontWeight: 900, cursor: "pointer" }}>Mark as resting</button>
            </div>
            {restDates.length > 0 && <div style={{ marginTop: 9, fontSize: 11.5, color: "#8C6B9E" }}>{restDates.length} rest {restDates.length === 1 ? "day" : "days"} marked so far.</div>}
          </div>

          <div style={{ marginBottom: 14, padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.82)", border: "1px solid #CFE8E1" }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#318C79" }}>⚙️ EXPERIENCE</div>
            <label style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, fontSize: 14, fontWeight: 900, color: "#318C79", cursor: "pointer" }}>
              <input type="checkbox" checked={!!preferences.focus_mode} onChange={(event) => updatePreference({ focus_mode: event.target.checked })} />
              🎯 PlushFocus — show one task at a time
            </label>
            <div style={{ marginTop: 5, marginBottom: 4, fontSize: 11, lineHeight: 1.45, color: "#7B6888" }}>
              Shows just your next task on Today instead of the full list — good when a long list feels like too many decisions at once.
            </div>
            {[
              ["gentle_streaks", "Use gentle consistency tracking"],
              ["large_text", "Larger text"],
              ["reduced_motion", "Reduce animation"],
              ["high_contrast", "Higher contrast"],
              ["simple_mode", "Simpler, quieter layout"],
              ["pattern_insights_enabled", "Show PlushInsights (private mood and energy pattern suggestions)"],
              ["colorblind_mode", "Colorblind-friendly colors"],
            ].map(([key, label]) => (
              <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 9, fontSize: 12.5, fontWeight: 700 }}>
                <input type="checkbox" checked={!!preferences[key]} onChange={(event) => updatePreference({ [key]: event.target.checked })} />
                {label}
              </label>
            ))}
            <button onClick={() => savePreferences()} style={{ marginTop: 12, padding: "8px 11px", borderRadius: 9, border: 0, background: "#318C79", color: "white", fontWeight: 900, cursor: "pointer" }}>Save settings</button>
          </div>

          <div id="feedback-card" style={{ marginBottom: 14, padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.82)", border: "1px solid #DCC9E8" }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#6D5A7C" }}>💌 FEEDBACK & SUPPORT</div>
            <div style={{ marginTop: 4, fontSize: 11.5, lineHeight: 1.45, color: "#8C6B9E" }}>Found a bug, or something feel off? Tell me here — it goes straight to the person who maintains PlushLife.</div>
            <textarea value={feedbackText} onChange={(event) => setFeedbackText(event.target.value)} maxLength={2000} placeholder="What's going on?" style={{ width: "100%", boxSizing: "border-box", marginTop: 8, minHeight: 70, padding: 9, borderRadius: 10, border: "1px solid #DCC9E8", resize: "vertical" }} />
            <button type="button" onClick={submitFeedback} style={{ marginTop: 8, padding: "8px 11px", borderRadius: 9, border: 0, background: "#A65DC1", color: "white", fontWeight: 900, cursor: "pointer" }}>💌 Send feedback</button>
            {feedbackMessage && <div style={{ marginTop: 6, fontSize: 11.5, color: "#8C6B9E" }}>{feedbackMessage}</div>}
          </div>

          <div style={{ marginBottom: 14, padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.82)", border: "1px solid #B9DCF6" }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#4C8FE8" }}>📦 PLUSHPRIVACY · YOUR DATA</div>
            <div style={{ marginTop: 4, fontSize: 11.5, lineHeight: 1.45, color: "#8C6B9E" }}>Your tasks, schedules, reflections, and progress are yours. Download a copy anytime.</div>
            <div style={{ marginTop: 9, padding: "10px 12px", borderRadius: 11, background: "#F7FBFF", border: "1px solid #D9ECFA" }}>
              <div style={{ fontSize: 12, fontWeight: 900, color: "#2D6BB5" }}>🔒 We will never sell your data. Ever.</div>
              <div style={{ marginTop: 3, fontSize: 11, lineHeight: 1.45, color: "#4C7AA8" }}>No ads, no data brokers, no "anonymized insights" sold to anyone. Your habits, moods, and reflections are not a product.</div>
            </div>
            <div style={{ display: "flex", gap: 7, marginTop: 8, flexWrap: "wrap" }}>
              <button type="button" onClick={exportMyData} style={{ padding: "8px 11px", borderRadius: 9, border: "1px solid #B9DCF6", background: "#F7FBFF", color: "#4C8FE8", fontWeight: 900, cursor: "pointer" }}>⬇️ Download my data</button>
              <button type="button" onClick={() => restoreFileInputRef.current?.click()} style={{ padding: "8px 11px", borderRadius: 9, border: "1px solid #B9DCF6", background: "white", color: "#4C8FE8", fontWeight: 900, cursor: "pointer" }}>⬆️ Restore from backup</button>
              <input ref={restoreFileInputRef} type="file" accept="application/json" style={{ display: "none" }}
                onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) restoreFromBackup(file); }} />
            </div>
            <div style={{ marginTop: 6, fontSize: 10.5, lineHeight: 1.4, color: "#8C6B9E" }}>Restoring brings back your own tasks, schedules, progress, and reflections from a downloaded backup — useful after a reinstall or a new phone. Guardian connections aren't included; re-invite any Guardian afterward.</div>
            <div style={{ marginTop: 12, paddingTop: 11, borderTop: "1px solid #D9ECFA" }}>
              <div style={{ fontSize: 10.5, fontWeight: 800, color: "#4C8FE8" }}>DELETE SOME OF MY DATA</div>
              <div style={{ marginTop: 3, fontSize: 10.5, color: "#8C6B9E" }}>These delete just that category — your account, tasks, and routines stay untouched.</div>
              <div style={{ display: "flex", gap: 7, marginTop: 8, flexWrap: "wrap" }}>
                <button type="button" onClick={deleteAllCheckIns} style={{ padding: "7px 11px", borderRadius: 9, border: "1px solid #E7C5CD", background: "transparent", color: "#A76676", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>Delete all check-ins</button>
                <button type="button" onClick={deleteAllReflections} style={{ padding: "7px 11px", borderRadius: 9, border: "1px solid #E7C5CD", background: "transparent", color: "#A76676", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>Delete all reflections</button>
              </div>
            </div>
          </div>

          <div style={{ padding: 16, borderRadius: 18, background: "rgba(255,255,255,0.82)", border: "1px solid #F0D5DB" }}>
            <div style={{ fontSize: 12, fontWeight: 900, color: "#A76676" }}>🔐 ACCOUNT</div>
            <div style={{ marginTop: 4, fontSize: 11.5, color: "#8C6B9E" }}>Current email: {user.email || "—"}</div>
            <div style={{ marginTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, flexWrap: "wrap", padding: "8px 10px", borderRadius: 9, background: "rgba(255,255,255,0.6)", border: "1px solid #F0D5DB" }}>
              <span style={{ fontSize: 11.5, color: "#8C6B9E" }}>{
                !online || syncStatus === "offline" ? "📡 Offline — changes will wait for a connection" :
                syncStatus === "syncing" ? "☁️ Syncing…" :
                syncStatus === "error" ? "⚠️ Sync failed" :
                `☁️ Synced${lastSyncedAt ? ` · ${new Date(lastSyncedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}` : ""}`
              }</span>
              <button type="button" disabled={syncStatus === "syncing"} onClick={syncNow} style={{ padding: "5px 8px", borderRadius: 8, border: "1px solid #D7B8E2", background: "white", color: "#8D5CA5", fontWeight: 800, fontSize: 11, cursor: syncStatus === "syncing" ? "wait" : "pointer" }}>
                {syncStatus === "error" ? "Retry" : "Sync now"}
              </button>
            </div>
            <div style={{ display: "flex", gap: 7, marginTop: 8, flexWrap: "wrap" }}>
              <input type="email" value={emailChangeDraft} onChange={(event) => setEmailChangeDraft(event.target.value)} placeholder="New email address" aria-label="New email address" style={{ flex: "1 1 190px", minWidth: 0, padding: "8px 10px", borderRadius: 9, border: "1px solid #DCC9E8", background: "white" }} />
              <button type="button" onClick={requestEmailChange} style={{ padding: "8px 10px", borderRadius: 9, border: 0, background: "#4C8FE8", color: "white", fontWeight: 900, cursor: "pointer" }}>Change email</button>
            </div>
            <div style={{ marginTop: 6, fontSize: 10.5, lineHeight: 1.4, color: "#8C6B9E" }}>For security, a confirmation link goes to both your current email and the new one. Nothing changes until both are confirmed.</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap", marginTop: 14, paddingTop: 12, borderTop: "1px solid #F0D5DB" }}>
              <button type="button" disabled={signingOut} onClick={() => { void handleSignOut(); }} style={{ padding: "7px 10px", borderRadius: 9, border: "1px solid #D7B8E2", background: "#FFFFFF", color: "#8D5CA5", fontWeight: 800, fontSize: 12, cursor: signingOut ? "wait" : "pointer", opacity: signingOut ? 0.65 : 1 }}>
                🚪 {signingOut ? "Signing out…" : "Sign out"}
              </button>
              <button type="button" onClick={signOutOtherDevices} style={{ padding: "7px 10px", borderRadius: 9, border: "1px solid #E4C2C9", background: "#FFF8F9", color: "#B0576B", fontWeight: 800, fontSize: 12, cursor: "pointer" }}>Sign out other devices</button>
            </div>
            <div style={{ marginTop: 12, paddingTop: 11, borderTop: "1px solid #F0D5DB" }}>
              <button onClick={deleteMyAccount} style={{ padding: "4px 6px", borderRadius: 7, border: "1px solid #E7C5CD", background: "transparent", color: "#A76676", fontWeight: 700, fontSize: 10, cursor: "pointer" }}>Delete account</button>
              <div style={{ marginTop: 3, fontSize: 10, color: "#9A6673" }}>Requires confirmation and cannot be undone.</div>
            </div>
          </div>

          {settingsMessage && <div style={{ marginTop: 12, fontSize: 12, color: "#318C79", fontWeight: 700 }}>{settingsMessage}</div>}
          </ToolPanel>
  );
}
