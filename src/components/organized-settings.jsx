import { CozyComfortContext } from "./cozy-space.jsx";
import { WidgetSettings } from "./widget-settings.jsx";
import { HomeLayoutEditor } from "./home-layout-editor.jsx";
import { ToolPanel } from "./shared.jsx";
import { PlushGoldPreview } from "./plush-gold-preview.jsx";
import { RecommendationSettings } from "./recommendation-settings.jsx";

const LazyAppearanceThemePicker = React.lazy(() => import("./appearance-theme-picker.jsx").then((module) => ({ default: module.AppearanceThemePicker })));

const cardStyle = {
  background: "var(--pl-theme-surface)",
  border: "1px solid var(--pl-theme-line,#E9DDF6)",
  borderRadius: 20,
  overflow: "hidden",
  boxShadow: "0 8px 22px rgba(25,18,31,.10)",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 12px",
  borderRadius: 13,
  border: "1px solid var(--pl-theme-line,#E9DDF6)",
  background: "var(--pl-theme-surface)",
  color: "var(--pl-theme-ink,#51425E)",
  fontSize: 14,
};

const primaryButton = {
  padding: "10px 13px",
  borderRadius: 13,
  border: 0,
  background: "var(--pl-theme-accent)",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
};

const secondaryButton = {
  padding: "9px 12px",
  borderRadius: 13,
  border: "1px solid var(--pl-theme-line,#E9DDF6)",
  background: "var(--pl-theme-surface)",
  color: "var(--pl-theme-ink,#755D82)",
  fontWeight: 800,
  cursor: "pointer",
};

function SectionTitle({ icon, title, description }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 18, fontWeight: 900, color: "var(--pl-theme-ink,#5B4B6B)" }}>
        <span aria-hidden="true">{icon}</span><span>{title}</span>
      </div>
      {description && <div style={{ marginTop: 5, color: "var(--pl-theme-muted,#8A7895)", fontSize: 12.5, lineHeight: 1.5 }}>{description}</div>}
    </div>
  );
}

function Card({ children, style }) {
  return <div style={{ ...cardStyle, padding: 15, marginBottom: 12, ...style }}>{children}</div>;
}

function SettingsHomeRow({ icon, title, description, onClick, badge }) {
  return (
    <button type="button" onClick={onClick} style={{
      width: "100%", border: 0, borderBottom: "1px solid var(--pl-theme-line,#E9DDF6)", background: "transparent",
      padding: "13px 14px", display: "grid", gridTemplateColumns: "38px 1fr auto", gap: 10,
      alignItems: "center", textAlign: "left", cursor: "pointer", color: "inherit",
    }}>
      <span aria-hidden="true" style={{ width: 38, height: 38, borderRadius: 13, display: "grid", placeItems: "center", background: "var(--pl-theme-surface)", border: "1px solid var(--pl-theme-line,#E9DDF6)", boxShadow: "0 4px 10px rgba(102,66,119,.05)", fontSize: 19 }}>{icon}</span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 14.5, fontWeight: 900, color: "var(--pl-theme-ink,#5B4B6B)" }}>{title}</span>
        <span style={{ display: "block", marginTop: 2, fontSize: 11.5, lineHeight: 1.4, color: "var(--pl-theme-muted,#8A7895)" }}>{description}</span>
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {badge && <span style={{ padding: "3px 7px", borderRadius: 999, background: "var(--pl-theme-surface-2,#EEF8F4)", color: "var(--pl-theme-ink,#38816F)", fontSize: 10, fontWeight: 900 }}>{badge}</span>}
        <span aria-hidden="true" style={{ color: "var(--pl-theme-muted,#A997B2)", fontSize: 22 }}>›</span>
      </span>
    </button>
  );
}

function ToggleRow({ checked, onChange, title, description }) {
  return (
    <label style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center", padding: "12px 0", borderBottom: "1px solid var(--pl-theme-line,#E9DDF6)", cursor: "pointer" }}>
      <span>
        <span style={{ display: "block", fontSize: 13.5, fontWeight: 850, color: "var(--pl-theme-ink,#5B4B6B)" }}>{title}</span>
        {description && <span style={{ display: "block", marginTop: 3, fontSize: 11.5, lineHeight: 1.45, color: "var(--pl-theme-muted,#8A7895)" }}>{description}</span>}
      </span>
      <input type="checkbox" checked={!!checked} onChange={onChange} style={{ width: 22, height: 22, accentColor: "#9660AF" }} />
    </label>
  );
}

function DetailHeader({ title, onBack }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <button type="button" onClick={onBack} aria-label="Back to settings" style={{ ...secondaryButton, padding: "7px 10px", minWidth: 44 }}>‹ Back</button>
      <div style={{ fontSize: 16, fontWeight: 900, color: "var(--pl-theme-ink,#5B4B6B)" }}>{title}</div>
    </div>
  );
}

function formatSyncStatus(online, syncStatus, lastSyncedAt) {
  if (!online || syncStatus === "offline") return "Offline — changes will sync when you're connected";
  if (syncStatus === "syncing") return "Syncing…";
  if (syncStatus === "error") return "Sync needs attention";
  if (!lastSyncedAt) return "Ready to sync";
  try { return `Synced ${new Date(lastSyncedAt).toLocaleString()}`; } catch (_error) { return "Synced"; }
}

export function SettingsPanel({ open, onClose, openDailyCheckIn, watchPairingCode, setWatchPairingCode, connectWatch, watchPairingBusy, watchPairingMessage, localWatchSyncBusy, startLocalWatchSync, localWatchSyncMessage, dailyCheckIn, pct, rows, viewDone, weeklyOverallPct, widgetSyncMsg, setWidgetSyncMsg, displayNameDraft, setDisplayNameDraft, saveDisplayName, comfortItemDraft, setComfortItemDraft, saveComfortItem, preferences, appearanceTheme, selectAppearanceTheme, dinoTheme, updatePreference, enableNotifications, smartReminderSuggestion, restDatesSet, toggleRestToday, period, restRangeDraft, setRestRangeDraft, saveRestRange, restDates, feedbackText, setFeedbackText, submitFeedback, feedbackMessage, exportMyData, restoreFileInputRef, restoreFromBackup, deleteAllCheckIns, deleteAllReflections, user, online, syncStatus, lastSyncedAt, syncNow, emailChangeDraft, setEmailChangeDraft, requestEmailChange, signingOut, handleSignOut, signOutOtherDevices, deleteMyAccount, deviceBackupStatus, refreshDeviceBackup, deviceBackupBusy, verifyDeviceBackupNow, deviceBackupVerifyBusy, settingsMessage }) {
  const [section, setSection] = React.useState("home");
  const [search, setSearch] = React.useState("");
  const cozy = React.useContext(CozyComfortContext);
  const [preferredNameDraft, setPreferredNameDraft] = React.useState("");
  const [plushNameDraft, setPlushNameDraft] = React.useState("");
  React.useEffect(() => {
    if (!open || cozy?.status !== "ready") return;
    setPreferredNameDraft(String(cozy?.profile?.fields?.nickname || ""));
    setPlushNameDraft(String(cozy?.profile?.pet_name || ""));
  }, [open, cozy?.status, cozy?.profile?.fields?.nickname, cozy?.profile?.pet_name]);
  const savePreferredName = async () => {
    if (!cozy || cozy.status !== "ready") return;
    await cozy.save({...cozy.profile, fields:{...cozy.profile.fields, nickname:preferredNameDraft.trim()}});
  };
  const savePlushName = async () => {
    if (!cozy || cozy.status !== "ready") return;
    await cozy.save({...cozy.profile, pet_name:plushNameDraft.trim()});
  };
  const [comebackOptOut, setComebackOptOut] = React.useState(() => {
    try { return !!window.PlushLifeComebackReminder?.isOptedOut?.(); } catch (_error) { return false; }
  });
  React.useEffect(() => {
    const resync = () => {
      try { setComebackOptOut(!!window.PlushLifeComebackReminder?.isOptedOut?.()); } catch (_error) {}
    };
    window.addEventListener("plushlife:comeback-reminder-optout-changed", resync);
    return () => window.removeEventListener("plushlife:comeback-reminder-optout-changed", resync);
  }, []);
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = React.useState("");
  const [deletingAccount, setDeletingAccount] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setSection("home");
      setSearch("");
    }
  }, [open]);

  if (!open) return null;

  const categories = [
    ["personalize", "👤", "Personalize", "Name, comfort item, dark appearance, themes, Nursery, Dino Theme", "name profile theme dark baby dino appearance comfort"],
    ["notifications", "🔔", "Notifications & Reminders", "Reminder times, quiet hours, push notifications", "notifications reminders quiet push nurturing discreet"],
    ["experience", "✨", "Experience", "Focus, accessibility, motion, contrast, PlushInsights", "focus accessibility text motion contrast simple insights colorblind consistency"],
    ["recommendations", "🧠", "Recommendations", "Suggestion boundaries and learned-pattern corrections", "recommendations learning profile boundaries forget correction"],
    ["devices", "⌚", "Devices", "Amazfit watch, instant sync, and home-screen widget", "watch amazfit widget bluetooth devices sync"],
    ["rest", "🌴", "Rest & Vacation", "Pause tasks and reminders without losing progress", "rest vacation illness pause"],
    ["privacy", "🔐", "Privacy & Data", "Backup, restore, and delete selected data", "privacy data backup restore export delete reflections check-ins"],
    ["support", "💬", "Help & Feedback", "Send feedback or report something that feels off", "feedback help support bug"],
    ["gold", "✨", "PlushLife Plus Preview", "Future premium intelligence · everything included free for now", "gold premium plus preview subscription intelligence"],
    ["account", "🔑", "Account", "Email, sync status, sessions, and account controls", "account email sync sign out delete account"],
  ];

  const query = search.trim().toLowerCase();
  const visibleCategories = query ? categories.filter((item) => `${item[2]} ${item[3]} ${item[4]}`.toLowerCase().includes(query)) : categories;
  const primaryCategoryIds = new Set(["personalize", "notifications", "experience", "privacy"]);
  const primaryCategories = visibleCategories.filter((item) => primaryCategoryIds.has(item[0]));
  const moreCategories = visibleCategories.filter((item) => !primaryCategoryIds.has(item[0]));

  const home = (
    <>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: "var(--pl-theme-muted,#8A7895)", lineHeight: 1.45 }}>Start with the common stuff. Everything else is still here when you need it.</div>
        <div style={{ position: "relative", marginTop: 11 }}>
          <span aria-hidden="true" style={{ position: "absolute", left: 12, top: 11, color: "var(--pl-theme-muted,#A493AD)" }}>⌕</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search settings" aria-label="Search settings" style={{ ...inputStyle, paddingLeft: 35, background: "var(--pl-theme-surface,#FFFCFE)" }} />
        </div>
      </div>
      <div style={cardStyle}>
        {(query ? visibleCategories : primaryCategories).map(([id, icon, title, description]) => (
          <SettingsHomeRow key={id} icon={icon} title={title} description={description} onClick={() => setSection(id)} badge={id === "account" && (!online || syncStatus === "offline") ? "Offline" : null} />
        ))}
        {!query && moreCategories.length > 0 && (
          <details>
            <summary style={{ minHeight: 48, padding: "0 14px", display: "list-item", alignContent: "center", cursor: "pointer", fontSize: 13, fontWeight: 900, color: "var(--pl-theme-muted,#7B6888)" }}>More settings · {moreCategories.length}</summary>
            <div style={{ borderTop: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
              {moreCategories.map(([id, icon, title, description]) => (
                <SettingsHomeRow key={id} icon={icon} title={title} description={description} onClick={() => setSection(id)} badge={id === "account" && (!online || syncStatus === "offline") ? "Offline" : null} />
              ))}
            </div>
          </details>
        )}
        {visibleCategories.length === 0 && <div style={{ padding: 22, textAlign: "center", color: "var(--pl-theme-muted,#8A7895)", fontSize: 12.5 }}>No settings match “{search}”.</div>}
      </div>
      {settingsMessage && <div role="status" style={{ marginTop: 12, padding: "10px 12px", borderRadius: 11, background: "var(--pl-theme-surface-2,#F0FAF6)", color: "var(--pl-theme-ink,#347865)", fontSize: 12, fontWeight: 800 }}>{settingsMessage}</div>}
    </>
  );

  const personalize = (
    <>
      <DetailHeader title="Personalize" onBack={() => setSection("home")} />
      <SectionTitle icon="👤" title="Make PlushLife yours" description="Your name, comfort wording, and visual style live here." />
      <Card>
        <div style={{marginBottom:12,padding:11,borderRadius:13,background:"var(--pl-theme-surface-2,#F7F1FB)",fontSize:12,lineHeight:1.45,color:"var(--pl-theme-muted,#8A7895)"}}>
          <strong style={{color:"var(--pl-theme-ink,#5B4B6B)"}}>Personal names</strong><br/>
          Your preferred name is what your Plush uses in greetings. Your account/display name is used elsewhere in PlushLife.
        </div>
        <label style={{ display: "grid", gap: 6, fontSize: 11.5, fontWeight: 900, color: "var(--pl-theme-ink,#745D81)" }}>
          PREFERRED NAME
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 8 }}>
            <input type="text" value={preferredNameDraft} onChange={(event) => setPreferredNameDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") savePreferredName(); }} maxLength={40} placeholder="What your Plush should call you" style={inputStyle} />
            <button type="button" onClick={savePreferredName} disabled={cozy?.status !== "ready"} style={primaryButton}>Save</button>
          </div>
        </label>
        <label style={{ display: "grid", gap: 6, marginTop: 15, fontSize: 11.5, fontWeight: 900, color: "var(--pl-theme-ink,#745D81)" }}>
          PLUSH NAME · OPTIONAL
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 8 }}>
            <input type="text" value={plushNameDraft} onChange={(event) => setPlushNameDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") savePlushName(); }} maxLength={40} placeholder="Name your companion" style={inputStyle} />
            <button type="button" onClick={savePlushName} disabled={cozy?.status !== "ready"} style={primaryButton}>Save</button>
          </div>
        </label>
      </Card>
      <Card>
        <label style={{ display: "grid", gap: 6, fontSize: 11.5, fontWeight: 900, color: "var(--pl-theme-ink,#745D81)" }}>
          ACCOUNT / DISPLAY NAME
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 8 }}>
            <input type="text" value={displayNameDraft} onChange={(event) => setDisplayNameDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") saveDisplayName(); }} maxLength={40} placeholder="Your name" style={inputStyle} />
            <button type="button" onClick={saveDisplayName} style={primaryButton}>Save</button>
          </div>
        </label>
        <div style={{ marginTop: 5, fontSize: 11, color: "var(--pl-theme-muted,#95859E)" }}>Your heading will read “{displayNameDraft.trim() || "Name"}'s PlushLife.”</div>
        <label style={{ display: "grid", gap: 6, marginTop: 15, fontSize: 11.5, fontWeight: 900, color: "var(--pl-theme-ink,#745D81)" }}>
          COMFORT ITEM · OPTIONAL
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 8 }}>
            <input type="text" value={comfortItemDraft} onChange={(event) => setComfortItemDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") saveComfortItem(); }} maxLength={80} placeholder="Favorite plush, blanket…" style={inputStyle} />
            <button type="button" onClick={saveComfortItem} style={primaryButton}>Save</button>
          </div>
        </label>
      </Card>
      <Card><HomeLayoutEditor value={preferences.home_layout} onSave={home_layout => updatePreference({ home_layout })} /></Card>
      <Card>
        <React.Suspense fallback={<div style={{ minHeight: 120, display: "grid", placeItems: "center", color: "var(--pl-theme-muted,#8A7895)", fontSize: 12.5 }}>Loading themes…</div>}>
          <LazyAppearanceThemePicker
            preferences={preferences}
            appearanceTheme={appearanceTheme}
            selectAppearanceTheme={selectAppearanceTheme}
            dinoTheme={dinoTheme}
            updatePreference={updatePreference}
          />
        </React.Suspense>
      </Card>
    </>
  );

  const notifications = (
    <>
      <DetailHeader title="Notifications & Reminders" onBack={() => setSection("home")} />
      <SectionTitle icon="🔔" title="PlushReminders" description="Choose when PlushLife can gently check in with you." />
      <Card>
        <button type="button" onClick={enableNotifications} style={{ ...primaryButton, background: "var(--pl-theme-accent,#388C79)" }}>🔔 Enable push notifications</button>
        <div style={{ marginTop: 7, fontSize: 11.5, lineHeight: 1.45, color: "var(--pl-theme-muted,#8A7895)" }}>Push notifications can arrive while PlushLife is closed.</div>
      </Card>
      <Card>
        <div style={{ fontSize: 11.5, fontWeight: 900, color: "var(--pl-theme-ink,#665474)" }}>REMINDER TIMES</div>
        <div style={{ marginTop: 5, fontSize: 11.5, color: "var(--pl-theme-muted,#8A7895)" }}>Tap a time to change it. Remove reminders you don't need.</div>
        <div style={{ marginTop: 8 }}>
          {(preferences.reminder_times || []).map((time, index) => (
            <div key={`${time}-${index}`} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
              <input aria-label={`Reminder ${index + 1}`} type="time" value={time} onChange={(event) => updatePreference({ reminder_times: preferences.reminder_times.map((item, itemIndex) => itemIndex === index ? event.target.value : item) })} style={{ ...inputStyle, padding: "9px 11px" }} />
              {preferences.reminder_times.length > 1 && <button type="button" onClick={() => updatePreference({ reminder_times: preferences.reminder_times.filter((_, itemIndex) => itemIndex !== index) })} style={{ ...secondaryButton, color: "var(--pl-theme-muted,#A65F70)" }}>Remove</button>}
            </div>
          ))}
        </div>
        {(preferences.reminder_times || []).length < 8 && <button type="button" onClick={() => updatePreference({ reminder_times: [...(preferences.reminder_times || []), "12:00"] })} style={{ ...secondaryButton, marginTop: 10 }}>＋ Add reminder</button>}
        {(preferences.reminder_times || []).length >= 5 && <div style={{ marginTop: 10, padding: "9px 10px", borderRadius: 10, background: "var(--pl-theme-surface-2,#FFF9E9)", border: "1px solid var(--pl-theme-line,#E9DDF6)", color: "var(--pl-theme-ink,#6B5A3D)", fontSize: 11.5, lineHeight: 1.45 }}><strong>REMINDER LOAD:</strong> You have {(preferences.reminder_times || []).length} daily reminders. If they start blending into the background, keeping fewer high-value times usually makes each one easier to notice.</div>}
        {smartReminderSuggestion && (preferences.reminder_times || []).length < 8 && (
          <div style={{ marginTop: 12, padding: 11, borderRadius: 12, background: "var(--pl-theme-surface-2,#F0FAF6)", border: "1px solid var(--pl-theme-line,#E9DDF6)", color: "var(--pl-theme-ink,#347865)", fontSize: 11.5, lineHeight: 1.45 }}>
            💡 You tend to check in around <strong>{smartReminderSuggestion.label}</strong>. <span style={{ opacity: .82 }}>This suggestion comes from your own recent check-in timing.</span>
            <div style={{ display: "flex", gap: 7, marginTop: 8 }}>
              <button type="button" onClick={() => updatePreference({ reminder_times: [...preferences.reminder_times, smartReminderSuggestion.suggestedTime] })} style={{ ...primaryButton, padding: "7px 10px", background: "var(--pl-theme-accent,#388C79)" }}>Add it</button>
              <button type="button" onClick={() => updatePreference({ smart_reminder_hint_dismissed_at: new Date().toISOString() })} style={{ ...secondaryButton, padding: "7px 10px" }}>No thanks</button>
            </div>
          </div>
        )}
      </Card>
      <Card>
        <div style={{ fontSize: 11.5, fontWeight: 900, color: "var(--pl-theme-ink,#665474)" }}>QUIET HOURS</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
          <label style={{ fontSize: 11.5, fontWeight: 800, color: "var(--pl-theme-ink,#745D81)" }}>Starts<input type="time" value={preferences.quiet_start || ""} onChange={(event) => updatePreference({ quiet_start: event.target.value })} style={{ ...inputStyle, marginTop: 5, padding: "9px 10px" }} /></label>
          <label style={{ fontSize: 11.5, fontWeight: 800, color: "var(--pl-theme-ink,#745D81)" }}>Ends<input type="time" value={preferences.quiet_end || ""} onChange={(event) => updatePreference({ quiet_end: event.target.value })} style={{ ...inputStyle, marginTop: 5, padding: "9px 10px" }} /></label>
        </div>
        <ToggleRow checked={preferences.discreet_notifications} onChange={(event) => updatePreference({ discreet_notifications: event.target.checked })} title="Discreet lock-screen wording" description="Also hides Guardian note previews." />
        <ToggleRow checked={preferences.nurturing_checkins} onChange={(event) => updatePreference({ nurturing_checkins: event.target.checked })} title="Nurturing check-ins" description="Allow PlushLife to use the warmer check-in style." />
        <ToggleRow checked={!!cozy?.profile.return_reminders && !comebackOptOut} onChange={async (event) => { const enabled=event.target.checked; if (await cozy?.save({...cozy.profile,return_reminders:enabled})) { try { window.PlushLifeComebackReminder?.setOptOut?.(!enabled); } catch (_error) {} setComebackOptOut(!enabled); } }} title="Gentle comeback nudges" description="One kind note if you've been away a couple of days. Turn off anytime — no guilt either way." />
      </Card>
    </>
  );

  const experience = (
    <>
      <DetailHeader title="Experience" onBack={() => setSection("home")} />
      <SectionTitle icon="✨" title="How PlushLife feels" description="These options save automatically." />
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", paddingBottom: 12, marginBottom: 4, borderBottom: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 900, color: "var(--pl-theme-ink,#6E5480)" }}>🎯 Today's check-in</div>
            <div style={{ marginTop: 3, fontSize: 11, lineHeight: 1.4, color: "var(--pl-theme-muted,#8A7895)" }}>Reopen today's check-in.</div>
          </div>
          <button type="button" onClick={openDailyCheckIn} style={{ ...secondaryButton, flexShrink: 0 }}>Change</button>
        </div>
        <ToggleRow checked={preferences.focus_mode} onChange={(event) => updatePreference({ focus_mode: event.target.checked })} title="🎯 PlushFocus — one task at a time" description="Show only your next task on Today when a full list feels like too much." />
        {[
          ["gentle_streaks", "Use gentle consistency tracking", "Keep progress language softer and less streak-focused."],
          ["large_text", "Larger text", "Increase readability throughout the tracker."],
          ["reduced_motion", "Reduce animation", "Use less movement and celebration animation."],
          ["high_contrast", "Higher contrast", "Increase separation between text and backgrounds."],
          ["simple_mode", "Simpler, quieter layout", "Reduce visual decisions, ambient theme effects, and extra decoration."],
          ["pattern_insights_enabled", "Show PlushInsights", "Private mood and energy pattern suggestions."],
          ["colorblind_mode", "Colorblind-friendly colors", "Use cues that rely less on color alone."],
        ].map(([key, title, description]) => <ToggleRow key={key} checked={preferences[key]} onChange={(event) => updatePreference({ [key]: event.target.checked })} title={title} description={description} />)}
      </Card>
    </>
  );

  const devices = (
    <>
      <DetailHeader title="Devices" onBack={() => setSection("home")} />
      <SectionTitle icon="⌚" title="Connected experiences" description="Watch pairing and the home-screen widget are kept together here." />
      <Card>
        <div style={{ fontSize: 13.5, fontWeight: 900, color: "var(--pl-theme-ink,#4D756B)" }}>⌚ Amazfit watch</div>
        <div style={{ marginTop: 4, fontSize: 11.5, lineHeight: 1.45, color: "var(--pl-theme-muted,#7E8B87)" }}>Open PlushLife on your watch, choose <strong>My tasks</strong>, then enter its code below.</div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 8, marginTop: 10 }}>
          <input type="text" value={watchPairingCode} onChange={(event) => setWatchPairingCode(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))} onKeyDown={(event) => { if (event.key === "Enter") connectWatch(); }} maxLength={8} placeholder="8-character code" style={{ ...inputStyle, letterSpacing: ".12em", textTransform: "uppercase" }} />
          <button type="button" disabled={watchPairingBusy} onClick={connectWatch} style={{ ...primaryButton, background: watchPairingBusy ? "#97B5AD" : "#388C79" }}>{watchPairingBusy ? "Connecting…" : "Connect"}</button>
        </div>
        {watchPairingMessage && <div role="status" style={{ marginTop: 8, fontSize: 11.5, color: "var(--pl-theme-ink,#47776B)", fontWeight: 700 }}>{watchPairingMessage}</div>}
      </Card>
      {window.Capacitor?.isNativePlatform?.() && window.Capacitor?.Plugins?.WatchSyncBridge && (
        <Card>
          <div style={{ fontSize: 13.5, fontWeight: 900, color: "var(--pl-theme-ink,#4D756B)" }}>⚡ Instant local sync</div>
          <div style={{ marginTop: 4, fontSize: 11.5, lineHeight: 1.45, color: "var(--pl-theme-muted,#7E8B87)" }}>Optional Bluetooth sync while this phone app is running. Normal watch sync still works as a fallback.</div>
          <button type="button" disabled={localWatchSyncBusy} onClick={startLocalWatchSync} style={{ ...secondaryButton, marginTop: 9, color: "var(--pl-theme-ink,#388C79)" }}>{localWatchSyncBusy ? "Waiting for watch…" : "Enable instant sync"}</button>
          {localWatchSyncMessage && <div role="status" style={{ marginTop: 7, fontSize: 11.5, color: "var(--pl-theme-ink,#6F5C7C)" }}>{localWatchSyncMessage}</div>}
        </Card>
      )}
      <WidgetSettings rows={rows} viewDone={viewDone} dailyCheckIn={dailyCheckIn} pct={pct} weeklyOverallPct={weeklyOverallPct} />
    </>
  );

  const recommendations = (
    <>
      <DetailHeader title="Recommendations" onBack={() => setSection("home")} />
      <SectionTitle icon="🧠" title="How suggestions fit you" description="The learning stays in the background. Use these controls only when you want to correct or limit it." />
      <RecommendationSettings user={user} />
    </>
  );

  const rest = (
    <>
      <DetailHeader title="Rest & Vacation" onBack={() => setSection("home")} />
      <SectionTitle icon="🌴" title="Protected rest" description="Pause the list and reminders without erasing progress." />
      <Card>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 900, color: "var(--pl-theme-ink,#4F756A)" }}>Rest today</div>
            <div style={{ marginTop: 3, fontSize: 11.5, color: "var(--pl-theme-muted,#81928D)" }}>Nothing is required today.</div>
          </div>
          <button type="button" onClick={toggleRestToday} style={{ ...secondaryButton, border: restDatesSet.has(period.date) ? "2px solid #388C79" : secondaryButton.border, color: "var(--pl-theme-ink,#388C79)" }}>{restDatesSet.has(period.date) ? "✓ Resting" : "Turn on"}</button>
        </div>
      </Card>
      <Card>
        <div style={{ fontSize: 13.5, fontWeight: 900, color: "var(--pl-theme-ink,#4F756A)" }}>Plan a rest range</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 9 }}>
          <label style={{ fontSize: 11.5, fontWeight: 800, color: "var(--pl-theme-muted,#6B817B)" }}>From<input type="date" value={restRangeDraft.start} onChange={(event) => setRestRangeDraft((current) => ({ ...current, start: event.target.value }))} style={{ ...inputStyle, marginTop: 5 }} /></label>
          <label style={{ fontSize: 11.5, fontWeight: 800, color: "var(--pl-theme-muted,#6B817B)" }}>To<input type="date" value={restRangeDraft.end} onChange={(event) => setRestRangeDraft((current) => ({ ...current, end: event.target.value }))} style={{ ...inputStyle, marginTop: 5 }} /></label>
        </div>
        <button type="button" onClick={saveRestRange} style={{ ...primaryButton, marginTop: 10, background: "var(--pl-theme-accent,#388C79)" }}>Mark as resting</button>
        {restDates.length > 0 && <div style={{ marginTop: 8, color: "var(--pl-theme-muted,#81928D)", fontSize: 11.5 }}>{restDates.length} rest {restDates.length === 1 ? "day" : "days"} marked.</div>}
      </Card>
    </>
  );

  const privacy = (
    <>
      <DetailHeader title="Privacy & Data" onBack={() => setSection("home")} />
      <SectionTitle icon="🔐" title="Your data stays yours" description="Backup, restore, or remove specific categories." />
      <Card style={{ background: "var(--pl-theme-surface,#F5FBF9)", borderColor: "var(--pl-theme-line,#CFE7DF)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 900, color: "var(--pl-theme-ink,#347865)" }}>📱 On-device backup</div>
            <div style={{ marginTop: 4, color: "var(--pl-theme-muted,#6E817B)", fontSize: 11.5, lineHeight: 1.45 }}>PlushLife keeps a second copy of your independently restorable data on this device. Cloud sync stays on so a new phone can still recover your account.</div>
            <div style={{ marginTop: 6, color: deviceBackupStatus?.stale ? "#A56D14" : "#56756C", fontSize: 11, fontWeight: 800 }}>
              {deviceBackupStatus?.savedAt ? (deviceBackupStatus.stale ? "Backup needs refreshing · last saved " : "Last saved ") + new Date(deviceBackupStatus.savedAt).toLocaleString() : deviceBackupStatus?.unavailable ? "On-device backup unavailable on this device" : "Waiting for the first on-device backup"}
            </div>
            {deviceBackupStatus?.exists && <div style={{ marginTop: 3, color: "var(--pl-theme-muted,#71857F)", fontSize: 10.5, lineHeight: 1.4 }}>{deviceBackupStatus.verified ? "✓ Latest backup verified" : "Verification recommended"} · Recovery snapshots: {deviceBackupStatus.snapshotCount || 1}/3</div>}
          </div>
          <div style={{ display: "grid", gap: 6, flexShrink: 0 }}>
            <button type="button" disabled={deviceBackupBusy} onClick={refreshDeviceBackup} style={{ ...secondaryButton, color: "var(--pl-theme-ink,#347865)", opacity: deviceBackupBusy ? .65 : 1 }}>{deviceBackupBusy ? "Saving…" : "Back up now"}</button>
            <button type="button" disabled={deviceBackupVerifyBusy || !deviceBackupStatus?.exists} onClick={verifyDeviceBackupNow} style={{ ...secondaryButton, color: "var(--pl-theme-muted,#3F78B8)", opacity: (deviceBackupVerifyBusy || !deviceBackupStatus?.exists) ? .55 : 1 }}>{deviceBackupVerifyBusy ? "Verifying…" : "Verify backup"}</button>
          </div>
        </div>
        <div style={{ marginTop: 9, padding: "8px 9px", borderRadius: 10, background: "rgba(255,255,255,.7)", color: "var(--pl-theme-muted,#71857F)", fontSize: 10.8, lineHeight: 1.45 }}>PlushLife keeps up to 3 recent recovery snapshots on this device. Nothing is deleted from the cloud automatically. Relationship, payment, push-token, and device-pairing records are deliberately not copied into the restorable device backup.</div>
      </Card>
      <Card style={{ background: "var(--pl-theme-surface,#F8FBFF)", borderColor: "var(--pl-theme-line,#D9E9F6)" }}>
        <div style={{ fontSize: 13.5, fontWeight: 900, color: "var(--pl-theme-muted,#3F78B8)" }}>🔒 We will never sell your data. Ever.</div>
        <div style={{ marginTop: 4, color: "var(--pl-theme-muted,#6985A3)", fontSize: 11.5, lineHeight: 1.45 }}>No data brokers and no sale of your habits, moods, or reflections.</div>
      </Card>
      <Card>
        <div style={{ display: "grid", gap: 8 }}>
          <button type="button" onClick={exportMyData} style={{ ...secondaryButton, textAlign: "left" }}>⬇️ Download my data</button>
          <button type="button" onClick={() => restoreFileInputRef.current?.click()} style={{ ...secondaryButton, textAlign: "left" }}>⬆️ Restore from backup</button>
          <input ref={restoreFileInputRef} type="file" accept="application/json" style={{ display: "none" }} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; if (file) restoreFromBackup(file); }} />
        </div>
        <div style={{ marginTop: 8, color: "var(--pl-theme-muted,#8A7895)", fontSize: 11.5, lineHeight: 1.45 }}>Backups include your own tasks, schedules, progress, and reflections. Guardian connections are not included.</div>
      </Card>
      <Card>
        <div style={{ fontSize: 12, fontWeight: 900, color: "var(--pl-theme-muted,#A65F70)" }}>DELETE SOME OF MY DATA</div>
        <div style={{ marginTop: 4, fontSize: 11.5, color: "var(--pl-theme-muted,#8A7895)" }}>These leave your account, tasks, and routines in place.</div>
        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
          <button type="button" onClick={deleteAllCheckIns} style={{ ...secondaryButton, color: "var(--pl-theme-muted,#A65F70)" }}>Delete all check-ins</button>
          <button type="button" onClick={deleteAllReflections} style={{ ...secondaryButton, color: "var(--pl-theme-muted,#A65F70)" }}>Delete all reflections</button>
        </div>
      </Card>
    </>
  );

  const support = (
    <>
      <DetailHeader title="Help & Feedback" onBack={() => setSection("home")} />
      <SectionTitle icon="💬" title="Tell us what feels off" description="Bug reports and feedback go straight to the person maintaining PlushLife." />
      <Card>
        <textarea value={feedbackText} onChange={(event) => setFeedbackText(event.target.value)} maxLength={2000} placeholder="What's going on?" style={{ ...inputStyle, minHeight: 120, resize: "vertical", fontFamily: "inherit" }} />
        <button type="button" onClick={submitFeedback} style={{ ...primaryButton, marginTop: 9 }}>💌 Send feedback</button>
        {feedbackMessage && <div role="status" style={{ marginTop: 7, color: "var(--pl-theme-ink,#755D82)", fontSize: 11.5 }}>{feedbackMessage}</div>}
      </Card>
    </>
  );

  const gold = (
    <>
      <DetailHeader title="PlushLife Plus Preview" onBack={() => setSection("home")} />
      <PlushGoldPreview />
    </>
  );

  const account = (
    <>
      <DetailHeader title="Account" onBack={() => setSection("home")} />
      <SectionTitle icon="🔑" title="Account & sync" description="Manage your email, sessions, and account controls." />
      <Card>
        <div style={{ fontSize: 11.5, color: "var(--pl-theme-muted,#8A7895)" }}>SIGNED IN AS</div>
        <div style={{ marginTop: 3, fontSize: 14, fontWeight: 900, color: "var(--pl-theme-ink,#5B4B6B)", overflowWrap: "anywhere" }}>{user?.email || "—"}</div>
        <div style={{ marginTop: 10, padding: "10px 11px", borderRadius: 11, background: online && syncStatus !== "offline" ? "#F0FAF6" : "#FFF7F2", color: online && syncStatus !== "offline" ? "#347865" : "#9A6B4F", fontSize: 11.5, fontWeight: 750 }}>{formatSyncStatus(online, syncStatus, lastSyncedAt)}</div>
        <button type="button" onClick={syncNow} style={{ ...secondaryButton, marginTop: 8 }}>{syncStatus === "error" ? "Retry sync" : "Sync now"}</button>
      </Card>
      <Card>
        <div style={{ fontSize: 12, fontWeight: 900, color: "var(--pl-theme-ink,#665474)" }}>CHANGE EMAIL</div>
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 8, marginTop: 8 }}>
          <input type="email" value={emailChangeDraft} onChange={(event) => setEmailChangeDraft(event.target.value)} placeholder="New email address" style={inputStyle} />
          <button type="button" onClick={requestEmailChange} style={{ ...primaryButton, background: "var(--pl-theme-accent,#4C8FE8)" }}>Change</button>
        </div>
        <div style={{ marginTop: 6, fontSize: 11, lineHeight: 1.4, color: "var(--pl-theme-muted,#8A7895)" }}>For security, confirmation links are sent before the address changes.</div>
      </Card>
      <Card>
        <div style={{ display: "grid", gap: 8 }}>
          <button type="button" disabled={signingOut} onClick={() => { void handleSignOut(); }} style={{ ...secondaryButton, textAlign: "left", opacity: signingOut ? .6 : 1 }}>🚪 {signingOut ? "Signing out…" : "Sign out"}</button>
          <button type="button" onClick={signOutOtherDevices} style={{ ...secondaryButton, textAlign: "left", color: "var(--pl-theme-muted,#A65F70)" }}>Sign out other devices</button>
        </div>
      </Card>
      <Card style={{ borderColor: "var(--pl-theme-line,#EACFD6)" }}>
        <div style={{ fontSize: 12, fontWeight: 900, color: "var(--pl-theme-muted,#A65F70)" }}>DANGER ZONE</div>
        <div style={{ marginTop: 4, fontSize: 11.5, color: "var(--pl-theme-muted,#8A7895)" }}>Deleting your account requires confirmation and cannot be undone.</div>
        <button type="button" onClick={() => { setDeleteConfirmation(""); setDeleteDialogOpen(true); }} style={{ ...secondaryButton, marginTop: 9, color: "var(--pl-theme-muted,#A65F70)", borderColor: "var(--pl-theme-line,#E6C2CB)" }}>Delete account</button>
      </Card>
      {settingsMessage && <div role="status" style={{ marginTop: 10, color: "var(--pl-theme-ink,#347865)", fontSize: 12, fontWeight: 800 }}>{settingsMessage}</div>}
    </>
  );

  const pages = { home, personalize, notifications, experience, recommendations, devices, rest, privacy, support, gold, account };

  return (
    <ToolPanel title="Settings" onClose={onClose}>
      <div style={{ maxWidth: 620, margin: "0 auto" }}>{pages[section] || home}</div>
      {deleteDialogOpen && (
        <div role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget && !deletingAccount) setDeleteDialogOpen(false); }} style={{ position: "fixed", inset: 0, zIndex: 10040, display: "grid", placeItems: "center", padding: 18, background: "rgba(47,32,53,.48)" }}>
          <div role="dialog" aria-modal="true" aria-labelledby="delete-account-title" aria-describedby="delete-account-description" style={{ width: "min(440px,100%)", padding: 20, borderRadius: 20, background: "white", border: "1px solid var(--pl-theme-line,#E9DDF6)", boxShadow: "0 24px 70px rgba(47,32,53,.24)" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
              <div><div id="delete-account-title" style={{ fontSize: 18, fontWeight: 900, color: "var(--pl-theme-ink,#8E4057)" }}>Permanently delete this account?</div><div id="delete-account-description" style={{ marginTop: 7, fontSize: 12, lineHeight: 1.55, color: "var(--pl-theme-ink,#725F68)" }}>This permanently deletes your PlushLife account, tasks, progress, schedules, and private reflections. This cannot be undone.</div></div>
              <button type="button" aria-label="Close account deletion confirmation" disabled={deletingAccount} onClick={() => setDeleteDialogOpen(false)} style={{ minWidth: 44, minHeight: 44, border: 0, borderRadius: 12, background: "var(--pl-theme-surface-2,#F8F1F3)", color: "var(--pl-theme-ink,#8E4057)", fontSize: 20, cursor: deletingAccount ? "default" : "pointer" }}>×</button>
            </div>
            <label htmlFor="delete-account-confirmation" style={{ display: "grid", gap: 6, marginTop: 16, fontSize: 12, fontWeight: 900, color: "var(--pl-theme-ink,#66515A)" }}>Type DELETE MY ACCOUNT to continue<input id="delete-account-confirmation" autoFocus autoComplete="off" value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} disabled={deletingAccount} style={{ ...inputStyle, borderColor: "var(--pl-theme-line,#D8AEB9)" }} /></label>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 16, flexWrap: "wrap" }}>
              <button type="button" disabled={deletingAccount} onClick={() => setDeleteDialogOpen(false)} style={secondaryButton}>Cancel</button>
              <button type="button" disabled={deleteConfirmation !== "DELETE MY ACCOUNT" || deletingAccount} onClick={async () => { setDeletingAccount(true); await deleteMyAccount(); setDeletingAccount(false); }} style={{ ...primaryButton, background: "var(--pl-theme-accent,#A65F70)", opacity: deleteConfirmation === "DELETE MY ACCOUNT" && !deletingAccount ? 1 : .5, cursor: deleteConfirmation === "DELETE MY ACCOUNT" && !deletingAccount ? "pointer" : "not-allowed" }}>{deletingAccount ? "Deleting…" : "Delete my account"}</button>
            </div>
          </div>
        </div>
      )}
    </ToolPanel>
  );
}
