import { ToolPanel } from "./shared.jsx";
import { PlushGoldPreview } from "./plush-gold-preview.jsx";

const cardStyle = {
  background: "rgba(255,255,255,.86)",
  border: "1px solid #E8DCEB",
  borderRadius: 18,
  overflow: "hidden",
  boxShadow: "0 4px 16px rgba(74,48,84,.05)",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "11px 12px",
  borderRadius: 11,
  border: "1px solid #DCCFE1",
  background: "white",
  color: "#51425E",
  fontSize: 14,
};

const primaryButton = {
  padding: "10px 13px",
  borderRadius: 11,
  border: 0,
  background: "#9660AF",
  color: "white",
  fontWeight: 900,
  cursor: "pointer",
};

const secondaryButton = {
  padding: "9px 12px",
  borderRadius: 11,
  border: "1px solid #D9CBE0",
  background: "white",
  color: "#755D82",
  fontWeight: 800,
  cursor: "pointer",
};

function SectionTitle({ icon, title, description }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 18, fontWeight: 900, color: "#5B4B6B" }}>
        <span aria-hidden="true">{icon}</span><span>{title}</span>
      </div>
      {description && <div style={{ marginTop: 5, color: "#8A7895", fontSize: 12.5, lineHeight: 1.5 }}>{description}</div>}
    </div>
  );
}

function Card({ children, style }) {
  return <div style={{ ...cardStyle, padding: 15, marginBottom: 12, ...style }}>{children}</div>;
}

function SettingsHomeRow({ icon, title, description, onClick, badge }) {
  return (
    <button type="button" onClick={onClick} style={{
      width: "100%", border: 0, borderBottom: "1px solid #F0E8F2", background: "transparent",
      padding: "15px 14px", display: "grid", gridTemplateColumns: "38px 1fr auto", gap: 10,
      alignItems: "center", textAlign: "left", cursor: "pointer", color: "inherit",
    }}>
      <span aria-hidden="true" style={{ width: 38, height: 38, borderRadius: 12, display: "grid", placeItems: "center", background: "#F8F2FA", fontSize: 19 }}>{icon}</span>
      <span style={{ minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 14.5, fontWeight: 900, color: "#5B4B6B" }}>{title}</span>
        <span style={{ display: "block", marginTop: 2, fontSize: 11.5, lineHeight: 1.4, color: "#8A7895" }}>{description}</span>
      </span>
      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {badge && <span style={{ padding: "3px 7px", borderRadius: 999, background: "#EEF8F4", color: "#38816F", fontSize: 10, fontWeight: 900 }}>{badge}</span>}
        <span aria-hidden="true" style={{ color: "#A997B2", fontSize: 22 }}>‚Ä∫</span>
      </span>
    </button>
  );
}

function ToggleRow({ checked, onChange, title, description }) {
  return (
    <label style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 12, alignItems: "center", padding: "12px 0", borderBottom: "1px solid #F1EAF3", cursor: "pointer" }}>
      <span>
        <span style={{ display: "block", fontSize: 13.5, fontWeight: 850, color: "#5B4B6B" }}>{title}</span>
        {description && <span style={{ display: "block", marginTop: 3, fontSize: 11.5, lineHeight: 1.45, color: "#8A7895" }}>{description}</span>}
      </span>
      <input type="checkbox" checked={!!checked} onChange={onChange} style={{ width: 22, height: 22, accentColor: "#9660AF" }} />
    </label>
  );
}

function DetailHeader({ title, onBack }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
      <button type="button" onClick={onBack} aria-label="Back to settings" style={{ ...secondaryButton, padding: "7px 10px", minWidth: 44 }}>‚Äπ Back</button>
      <div style={{ fontSize: 16, fontWeight: 900, color: "#5B4B6B" }}>{title}</div>
    </div>
  );
}

function formatSyncStatus(online, syncStatus, lastSyncedAt) {
  if (!online || syncStatus === "offline") return "Offline ‚Äî changes will sync when you're connected";
  if (syncStatus === "syncing") return "Syncing‚Ä¶";
  if (syncStatus === "error") return "Sync needs attention";
  if (!lastSyncedAt) return "Ready to sync";
  try { return `Synced ${new Date(lastSyncedAt).toLocaleString()}`; } catch (_error) { return "Synced"; }
}

export function SettingsPanel({ open, onClose, watchPairingCode, setWatchPairingCode, connectWatch, watchPairingBusy, watchPairingMessage, localWatchSyncBusy, startLocalWatchSync, localWatchSyncMessage, dailyCheckIn, pct, rows, viewDone, weeklyOverallPct, widgetSyncMsg, setWidgetSyncMsg, displayNameDraft, setDisplayNameDraft, saveDisplayName, comfortItemDraft, setComfortItemDraft, saveComfortItem, preferences, appearanceTheme, selectAppearanceTheme, dinoTheme, updatePreference, enableNotifications, smartReminderSuggestion, restDatesSet, toggleRestToday, period, restRangeDraft, setRestRangeDraft, saveRestRange, restDates, feedbackText, setFeedbackText, submitFeedback, feedbackMessage, exportMyData, restoreFileInputRef, restoreFromBackup, deleteAllCheckIns, deleteAllReflections, user, online, syncStatus, lastSyncedAt, syncNow, emailChangeDraft, setEmailChangeDraft, requestEmailChange, signingOut, handleSignOut, signOutOtherDevices, deleteMyAccount, deviceBackupStatus, refreshDeviceBackup, deviceBackupBusy, verifyDeviceBackupNow, deviceBackupVerifyBusy, settingsMessage }) {
  const [section, setSection] = React.useState("home");
  const [search, setSearch] = React.useState("");
  const { APPEARANCE_THEMES } = window.PlushLifeContent;

  React.useEffect(() => {
    if (!open) {
      setSection("home");
      setSearch("");
    }
  }, [open]);

  if (!open) return null;

  const categories = [
    ["personalize", "üë§", "Personalize", "Name, comfort item, themes, Baby Mode, Dino Theme", "name profile theme baby dino appearance comfort"],
    ["notifications", "üîî", "Notifications & Reminders", "Reminder times, quiet hours, push notifications", "notifications reminders quiet push nurturing discreet"],
    ["experience", "‚ú®", "Experience", "Focus, accessibility, motion, contrast, PlushInsights", "focus accessibility text motion contrast simple insights colorblind consistency"],
    ["devices", "‚åö", "Devices", "Amazfit watch, instant sync, and home-screen widget", "watch amazfit widget bluetooth devices sync"],
    ["rest", "üå¥", "Rest & Vacation", "Pause tasks and reminders without losing progress", "rest vacation illness pause"],
    ["privacy", "üîê", "Privacy & Data", "Backup, restore, and delete selected data", "privacy data backup restore export delete reflections check-ins"],
    ["support", "üí¨", "Help & Feedback", "Send feedback or report something that feels off", "feedback help support bug"],
    ["gold", "‚ú®", "Plush Gold Preview", "Future premium intelligence ¬∑ everything included free for now", "gold premium plus preview subscription intelligence"],
    ["account", "üîë", "Account", "Email, sync status, sessions, and account controls", "account email sync sign out delete account"],
  ];

  const query = search.trim().toLowerCase();
  const visibleCategories = query ? categories.filter((item) => `${item[2]} ${item[3]} ${item[4]}`.toLowerCase().includes(query)) : categories;

  const home = (
    <>
      <div style={{ marginBottom: 14 }}>
        <div style={{ fontSize: 13, color: "#8A7895", lineHeight: 1.45 }}>Everything has a home now. Pick what you want to change.</div>
        <div style={{ position: "relative", marginTop: 11 }}>
          <span aria-hidden="true" style={{ position: "absolute", left: 12, top: 11, color: "#A493AD" }}>‚åï</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search settings" aria-label="Search settings" style={{ ...inputStyle, paddingLeft: 35, background: "#FFFCFE" }} />
        </div>
      </div>
      <div style={cardStyle}>
        {visibleCategories.map(([id, icon, title, description]) => (
          <SettingsHomeRow key={id} icon={icon} title={title} description={description} onClick={() => setSection(id)} badge={id === "account" && (!online || syncStatus === "offline") ? "Offline" : null} />
        ))}
        {visibleCategories.length === 0 && <div style={{ padding: 22, textAlign: "center", color: "#8A7895", fontSize: 12.5 }}>No settings match ‚Äú{search}‚Äù.</div>}
      </div>
      {settingsMessage && <div role="status" style={{ marginTop: 12, padding: "10px 12px", borderRadius: 11, background: "#F0FAF6", color: "#347865", fontSize: 12, fontWeight: 800 }}>{settingsMessage}</div>}
    </>
  );

  const personalize = (
    <>
      <DetailHeader title="Personalize" onBack={() => setSection("home")} />
      <SectionTitle icon="üë§" title="Make PlushLife yours" description="Your name, comfort wording, and visual style live here." />
      <Card>
        <label style={{ display: "grid", gap: 6, fontSize: 11.5, fontWeight: 900, color: "#745D81" }}>
          YOUR NAME
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 8 }}>
            <input type="text" value={displayNameDraft} onChange={(event) => setDisplayNameDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") saveDisplayName(); }} maxLength={40} placeholder="Your name" style={inputStyle} />
            <button type="button" onClick={saveDisplayName} style={primaryButton}>Save</button>
          </div>
        </label>
        <div style={{ marginTop: 5, fontSize: 11, color: "#95859E" }}>Your heading will read ‚Äú{displayNameDraft.trim() || "Name"}'s PlushLife.‚Äù</div>
        <label style={{ display: "grid", gap: 6, marginTop: 15, fontSize: 11.5, fontWeight: 900, color: "#745D81" }}>
          COMFORT ITEM ¬∑ OPTIONAL
          <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) auto", gap: 8 }}>
            <input type="text" value={comfortItemDraft} onChange={(event) => setComfortItemDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") saveComfortItem(); }} maxLength={80} placeholder="Favorite plush, blanket‚Ä¶" style={inputStyle} />
            <button type="button" onClick={saveComfortItem} style={primaryButton}>Save</button>
          </div>
        </label>
      </Card>
      <Card>
        <div style={{ fontSize: 11.5, fontWeight: 900, color: "#745D81" }}>AMBIENT THEME</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 7, marginTop: 8 }}>
          {APPEARANCE_THEMES.map((theme) => {
            const selected = appearanceTheme === theme.id;
            return <button key={theme.id} type="button" onClick={() => selectAppearanceTheme(theme.id)} aria-pressed={selected} style={{ padding: "10px 6px", borderRadius: 11, border: selected ? "2px solid #9660AF" : "1px solid #DED2E3", background: selected ? "#F7EEFA" : "white", color: "#695474", fontWeight: 900, cursor: "pointer" }}>{theme.icon} {theme.label}</button>;
          })}
        </div>
        <ToggleRow checked={preferences.nickname_style === "baby"} onChange={(event) => updatePreference({ nickname_style: event.target.checked ? "baby" : "warm", dino_theme: event.target.checked ? false : preferences.dino_theme })} title="üçº Baby Mode" description="Bigger words, rounder controls, and candy-soft decoration. Your tasks and progress do not change." />
        {preferences.nickname_style === "baby" && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, padding: "8px 0 2px" }}>
            <button type="button" onClick={() => updatePreference({ baby_voice: "motherly" })} style={{ ...secondaryButton, border: (preferences.baby_voice || "motherly") === "motherly" ? "2px solid #9660AF" : secondaryButton.border }}>üë© Motherly voice</button>
            <button type="button" onClick={() => updatePreference({ baby_voice: "fatherly" })} style={{ ...secondaryButton, border: preferences.baby_voice === "fatherly" ? "2px solid #4C8FE8" : secondaryButton.border }}>üë® Fatherly voice</button>
          </div>
        )}
        <ToggleRow checked={dinoTheme} onChange={(event) => updatePreference({ dino_theme: event.target.checked, nickname_style: event.target.checked ? "warm" : preferences.nickname_style })} title="ü¶ï Dino Theme" description="Friendly dinosaur decorations on the cozy theme." />
      </Card>
    </>
  );

  const notifications = (
    <>
      <DetailHeader title="Notifications & Reminders" onBack={() => setSection("home")} />
      <SectionTitle icon="üîî" title="PlushReminders" description="Choose when PlushLife can gently check in with you." />
      <Card>
        <button type="button" onClick={enableNotifications} style={{ ...primaryButton, background: "#388C79" }}>üîî Enable push notifications</button>
        <div style={{ marginTop: 7, fontSize: 11.5, lineHeight: 1.45, color: "#8A7895" }}>Push notifications can arrive while PlushLife is closed.</div>
      </Card>
      <Card>
        <div style={{ fontSize: 11.5, fontWeight: 900, color: "#665474" }}>REMINDER TIMES</div>
        <div style={{ marginTop: 5, fontSize: 11.5, color: "#8A7895" }}>Tap a time to change it. Remove reminders you don't need.</div>
        <div style={{ marginTop: 8 }}>
          {(preferences.reminder_times || []).map((time, index) => (
            <div key={`${time}-${index}`} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center", padding: "8px 0", borderBottom: "1px solid #F1EAF3" }}>
              <input aria-label={`Reminder ${index + 1}`} type="time" value={time} onChange={(event) => updatePreference({ reminder_times: preferences.reminder_times.map((item, itemIndex) => itemIndex === index ? event.target.value : item) })} style={{ ...inputStyle, padding: "9px 11px" }} />
              {preferences.reminder_times.length > 1 && <button type="button" onClick={() => updatePreference({ reminder_times: preferences.reminder_times.filter((_, itemIndex) => itemIndex !== index) })} style={{ ...secondaryButton, color: "#A65F70" }}>Remove</button>}
            </div>
          ))}
        </div>
        {(preferences.reminder_times || []).length < 8 && <button type="button" onClick={() => updatePreference({ reminder_times: [...(preferences.reminder_times || []), "12:00"] })} style={{ ...secondaryButton, marginTop: 10 }}>Ôºã Add reminder</button>}
        {(preferences.reminder_times || []).length >= 5 && <div style={{ marginTop: 10, padding: "9px 10px", borderRadius: 10, background: "#FFF9E9", border: "1px solid #F0D99E", color: "#6B5A3D", fontSize: 11.5, lineHeight: 1.45 }}><strong>REMINDER LOAD:</strong> You have {(preferences.reminder_times || []).length} daily reminders. If they start blending into the background, keeping fewer high-value times usually makes each one easier to notice.</div>}
        {smartReminderSuggestion && (preferences.reminder_times || []).length < 8◊n8∂âûÀk∫wµÁtÅëïÕç…•¡—•Ω∏ıÌëïÕç…•¡—•ΩπÙÄº¯•Ù4(ÄÄÄÄÄÄΩÖ…ê¯4(ÄÄÄÄº¯4(ÄÄ§Ï4(4(ÄÅçΩπÕ–ÅëïŸ•çïÃÄÙÄ†4(ÄÄÄÄ¯4(ÄÄÄÄÄÄÒï—Ö•±!ïÖëï»Å—•—±îÙâïŸ•çïÃàÅΩπ	Öç¨ıÏ†§ÄÙ¯ÅÕï—Mïç—•Ω∏†â°Ωµîà•ÙÄº¯4(ÄÄÄÄÄÄÒMïç—•ΩπQ•—±îÅ•çΩ∏Ùãä2hàÅ—•—±îÙâΩππïç—ïêÅï·¡ï…•ïπçïÃàÅëïÕç…•¡—•Ω∏Ùâ]Ö—ç†Å¡Ö•…•πúÅÖπêÅ—°îÅ°ΩµîµÕç…ïï∏Å›•ëùï–ÅÖ…îÅ≠ï¡–Å—Ωùï—°ï»Å°ï…î∏àÄº¯4(ÄÄÄÄÄÄÒÖ…ê¯4(ÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅôΩπ—M•ÈîËÄƒÃ∏‘∞ÅôΩπ—]ï•ù°–ËÄ‰¿¿∞ÅçΩ±Ω»ËÄàå—‹‘ŸàÅıÙ˚ä2hÅµÖÈô•–Å›Ö—ç†Ωë•ÿ¯4(ÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅµÖ…ù•πQΩ¿ËÄ–∞ÅôΩπ—M•ÈîËÄƒƒ∏‘∞Å±•πï!ï•ù°–ËÄƒ∏–‘∞ÅçΩ±Ω»ËÄàå›·‡‹àÅıÙ˘=¡ï∏ÅA±’Õ°1•ôîÅΩ∏ÅÂΩ’»Å›Ö—ç†∞Åç°ΩΩÕîÄÒÕ—…Ωπú˘5‰Å—ÖÕ≠ÃΩÕ—…Ωπú¯∞Å—°ï∏Åïπ—ï»Å•—ÃÅçΩëîÅâï±Ω‹∏Ωë•ÿ¯4(ÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅë•Õ¡±Ö‰ËÄâù…•êà∞Åù…•ëQïµ¡±Ö—ïΩ±’µπÃËÄâµ•πµÖ‡†¿∞≈ô»§ÅÖ’—ºà∞ÅùÖ¿ËÄ‡∞ÅµÖ…ù•πQΩ¿ËÄƒ¿ÅıÙ¯4(ÄÄÄÄÄÄÄÄÄÄÒ•π¡’–Å—Â¡îÙâ—ï·–àÅŸÖ±’îıÌ›Ö—ç°AÖ•…•πùΩëïÙÅΩπ°ÖπùîıÏ°ïŸïπ–§ÄÙ¯ÅÕï—]Ö—ç°AÖ•…•πùΩëî°ïŸïπ–π—Ö…ùï–πŸÖ±’îπ—ΩU¡¡ï…ÖÕî†§π…ï¡±Öçî†Ωmyµh¿¥ÂtΩú∞Äàà§πÕ±•çî†¿∞Ä‡§•ÙÅΩπ-ïÂΩ›∏ıÏ°ïŸïπ–§ÄÙ¯ÅÏÅ•òÄ°ïŸïπ–π≠ï‰ÄÙÙÙÄâπ—ï»à§ÅçΩππïç—]Ö—ç††§ÏÅıÙÅµÖ·1ïπù—†ıÏ·ÙÅ¡±Öçï°Ω±ëï»Ùà‡µç°Ö…Öç—ï»ÅçΩëîàÅÕ—Â±îıÌÏÄ∏∏π•π¡’—M—Â±î∞Å±ï——ï…M¡Öç•πúËÄà∏ƒ…ï¥à∞Å—ï·—Q…ÖπÕôΩ…¥ËÄâ’¡¡ï…çÖÕîàÅıÙÄº¯4(ÄÄÄÄÄÄÄÄÄÄÒâ’——Ω∏Å—Â¡îÙââ’——Ω∏àÅë•ÕÖâ±ïêıÌ›Ö—ç°AÖ•…•πù	’ÕÂÙÅΩπ±•ç¨ıÌçΩππïç—]Ö—ç°ÙÅÕ—Â±îıÌÏÄ∏∏π¡…•µÖ…Â	’——Ω∏∞ÅâÖç≠ù…Ω’πêËÅ›Ö—ç°AÖ•…•πù	’Õ‰Ä¸Äàå‰›’àÄËÄàåÃ‡·‹‰àÅıÙ˘Ì›Ö—ç°AÖ•…•πù	’Õ‰Ä¸ÄâΩππïç—•πüäòàÄËÄâΩππïç–âÙΩâ’——Ω∏¯4(ÄÄÄÄÄÄÄÄΩë•ÿ¯4(ÄÄÄÄÄÄÄÅÌ›Ö—ç°AÖ•…•πù5ïÕÕÖùîÄòòÄÒë•ÿÅ…Ω±îÙâÕ—Ö—’ÃàÅÕ—Â±îıÌÏÅµÖ…ù•πQΩ¿ËÄ‡∞ÅôΩπ—M•ÈîËÄƒƒ∏‘∞ÅçΩ±Ω»ËÄàå–‹‹‹Ÿà∞ÅôΩπ—]ï•ù°–ËÄ‹¿¿ÅıÙ˘Ì›Ö—ç°AÖ•…•πù5ïÕÕÖùïÙΩë•ÿ˘Ù4(ÄÄÄÄÄÄΩÖ…ê¯4(ÄÄÄÄÄÅÌ›•πëΩ‹πÖ¡Öç•—Ω»¸π•Õ9Ö—•ŸïA±Ö—ôΩ…¥¸∏†§ÄòòÅ›•πëΩ‹πÖ¡Öç•—Ω»¸πA±’ù•πÃ¸π]Ö—ç°MÂπç	…•ëùîÄòòÄ†4(ÄÄÄÄÄÄÄÄÒÖ…ê¯4(ÄÄÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅôΩπ—M•ÈîËÄƒÃ∏‘∞ÅôΩπ—]ï•ù°–ËÄ‰¿¿∞ÅçΩ±Ω»ËÄàå—‹‘ŸàÅıÙ˚äjÑÅ%πÕ—Öπ–Å±ΩçÖ∞ÅÕÂπåΩë•ÿ¯4(ÄÄÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅµÖ…ù•πQΩ¿ËÄ–∞ÅôΩπ—M•ÈîËÄƒƒ∏‘∞Å±•πï!ï•ù°–ËÄƒ∏–‘∞ÅçΩ±Ω»ËÄàå›·‡‹àÅıÙ˘=¡—•ΩπÖ∞Å	±’ï—ΩΩ—†ÅÕÂπåÅ›°•±îÅ—°•ÃÅ¡°ΩπîÅÖ¡¿Å•ÃÅ…’ππ•πú∏Å9Ω…µÖ∞Å›Ö—ç†ÅÕÂπåÅÕ—•±∞Å›Ω…≠ÃÅÖÃÅÑÅôÖ±±âÖç¨∏Ωë•ÿ¯4(ÄÄÄÄÄÄÄÄÄÄÒâ’——Ω∏Å—Â¡îÙââ’——Ω∏àÅë•ÕÖâ±ïêıÌ±ΩçÖ±]Ö—ç°MÂπç	’ÕÂÙÅΩπ±•ç¨ıÌÕ—Ö…—1ΩçÖ±]Ö—ç°MÂπçÙÅÕ—Â±îıÌÏÄ∏∏πÕïçΩπëÖ…Â	’——Ω∏∞ÅµÖ…ù•πQΩ¿ËÄ‰∞ÅçΩ±Ω»ËÄàåÃ‡·‹‰àÅıÙ˘Ì±ΩçÖ±]Ö—ç°MÂπç	’Õ‰Ä¸Äâ]Ö•—•πúÅôΩ»Å›Ö—ç£äòàÄËÄâπÖâ±îÅ•πÕ—Öπ–ÅÕÂπåâÙΩâ’——Ω∏¯4(ÄÄÄÄÄÄÄÄÄÅÌ±ΩçÖ±]Ö—ç°MÂπç5ïÕÕÖùîÄòòÄÒë•ÿÅ…Ω±îÙâÕ—Ö—’ÃàÅÕ—Â±îıÌÏÅµÖ…ù•πQΩ¿ËÄ‹∞ÅôΩπ—M•ÈîËÄƒƒ∏‘∞ÅçΩ±Ω»ËÄàåŸ’›àÅıÙ˘Ì±ΩçÖ±]Ö—ç°MÂπç5ïÕÕÖùïÙΩë•ÿ˘Ù4(ÄÄÄÄÄÄÄÄΩÖ…ê¯4(ÄÄÄÄÄÄ•Ù4(ÄÄÄÄÄÄÒÖ…ê¯4(ÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅë•Õ¡±Ö‰ËÄâô±ï‡à∞Å©’Õ—•ôÂΩπ—ïπ–ËÄâÕ¡Öçîµâï—›ïï∏à∞ÅùÖ¿ËÄƒ¿∞ÅÖ±•ùπ%—ïµÃËÄâçïπ—ï»àÅıÙ¯4(ÄÄÄÄÄÄÄÄÄÄÒë•ÿ¯4(ÄÄÄÄÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅôΩπ—M•ÈîËÄƒÃ∏‘∞ÅôΩπ—]ï•ù°–ËÄ‰¿¿∞ÅçΩ±Ω»ËÄàåŸ‘–‡¿àÅıÙ˚¬~NƒÅ!ΩµîµÕç…ïï∏Å›•ëùï–Ωë•ÿ¯4(ÄÄÄÄÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅµÖ…ù•πQΩ¿ËÄÃ∞ÅôΩπ—M•ÈîËÄƒƒ∏‘∞ÅçΩ±Ω»ËÄàå·‹‡‰‘àÅıÙ˘QΩëÖ‰ÅÌ¡ç—ÙîÉ
‹Å]ïï¨ÅÌ›ïï≠±Â=Ÿï…Ö±±Aç—ÙîΩë•ÿ¯4(ÄÄÄÄÄÄÄÄÄÄΩë•ÿ¯4(ÄÄÄÄÄÄÄÄÄÄÒâ’——Ω∏Å—Â¡îÙââ’——Ω∏àÅΩπ±•ç¨ıÏ†§ÄÙ¯ÅÏ4(ÄÄÄÄÄÄÄÄÄÄÄÅëΩç’µïπ–πë•Õ¡Ö—ç°Ÿïπ–°πï‹Å’Õ—ΩµŸïπ–†â¡±’Õ°±•ôîµ›•ëùï–µÕÂπåà§§Ï4(ÄÄÄÄÄÄÄÄÄÄÄÅçΩπÕ–Å]•ëùï—	…•ëùîÄÙÅ›•πëΩ‹πÖ¡Öç•—Ω»¸πA±’ù•πÃ¸π]•ëùï—	…•ëùîÏ4(ÄÄÄÄÄÄÄÄÄÄÄÅ•òÄ°]•ëùï—	…•ëùî§ÅÏ4(ÄÄÄÄÄÄÄÄÄÄÄÄÄÅçΩπÕ–Åπï·—QÖÕ¨ÄÙÅ…Ω›Ãπô•πê†°…Ω‹§ÄÙ¯ÄÖ…Ω‹π•Õ	Ωπ’ÃÄòòÄÖŸ•ï›Ωπïm…Ω‹π≠ïÂt§ÅÒÅ…Ω›Ãπô•πê†°…Ω‹§ÄÙ¯ÄÖ…Ω‹π•Õ	Ωπ’Ã§Ï4(ÄÄÄÄÄÄÄÄÄÄÄÄÄÅ]•ëùï—	…•ëùîπ’¡ëÖ—ï]•ëùï–°ÏÅπï·—QÖÕ¨ËÅëÖ•±Â°ïç≠%∏πëÖÂ}—Â¡îÄÙÙÙÄâ…ïÕ–àÄ¸ÄâIïÕ—•πúÅçΩ’π—ÃÅ—ΩëÖ‰àÄËÄ°πï·—QÖÕ¨¸π±Öâï∞ÅÒÄâQΩëÖ‰ùÃÅçÖ…•πúÅÕ—ï¡ÃÅÖ…îÅçΩµ¡±ï—îà§∞ÅëÖÂQÂ¡îËÅÄëÏ°ëÖ•±Â°ïç≠%∏πëÖÂ}—Â¡îÅÒÄâô’±∞à§π…ï¡±Öçî†Ωx∏º∞Ä°±ï——ï»§ÄÙ¯Å±ï——ï»π—ΩU¡¡ï…ÖÕî†§•ÙÅÖ‰É
‹ÄëÌ¡ç—ÙïÄ∞Å¡…Ωù…ïÕÃËÅ¡ç–∞Å›ïï≠±ÂA…Ωù…ïÕÃËÅ›ïï≠±Â=Ÿï…Ö±±Aç–∞Å—ÖÕ≠ÃËÅ…Ω›ÃπÕ±•çî†¿∞Ä–§πµÖ¿†°…Ω‹§ÄÙ¯Ä°ÏÅ≠ï‰ËÅ…Ω‹π≠ï‰∞Å±Öâï∞ËÅ…Ω‹π±Öâï∞∞ÅëΩπîËÄÑÖŸ•ï›Ωπïm…Ω‹π≠ïÂtÅÙ§§ÅÙ§πçÖ—ç†††§ÄÙ¯ÅÌÙ§Ï(ÄÄÄÄÄÄÄÄÄÄÄÅÙ4(ÄÄÄÄÄÄÄÄÄÄÄÅÕï—]•ëùï—MÂπç5Õú†â]•ëùï–ÅÕÂπçïêÑÉ¬~JTà§Ï4(ÄÄÄÄÄÄÄÄÄÄÄÅÕï—Q•µïΩ’–††§ÄÙ¯ÅÕï—]•ëùï—MÂπç5Õú†àà§∞ÄÃ¿¿¿§Ï4(ÄÄÄÄÄÄÄÄÄÅıÙÅÕ—Â±îıÌ¡…•µÖ…Â	’——ΩπÙ˘MÂπåÅπΩ‹Ωâ’——Ω∏¯4(ÄÄÄÄÄÄÄÄΩë•ÿ¯4(ÄÄÄÄÄÄÄÅÌ›•ëùï—MÂπç5ÕúÄòòÄÒë•ÿÅÕ—Â±îıÌÏÅµÖ…ù•πQΩ¿ËÄ‹∞ÅçΩ±Ω»ËÄàåÃ‡‡ƒŸà∞ÅôΩπ—M•ÈîËÄƒƒ∏‘∞ÅôΩπ—]ï•ù°–ËÄ‡¿¿ÅıÙ˘Ì›•ëùï—MÂπç5ÕùÙΩë•ÿ˘Ù4(ÄÄÄÄÄÄÄÄÒëï—Ö•±ÃÅÕ—Â±îıÌÏÅµÖ…ù•πQΩ¿ËÄƒƒÅıÙ¯4(ÄÄÄÄÄÄÄÄÄÄÒÕ’µµÖ…‰ÅÕ—Â±îıÌÏÅç’…ÕΩ»ËÄâ¡Ω•π—ï»à∞ÅçΩ±Ω»ËÄàå‹‘’‡»à∞ÅôΩπ—M•ÈîËÄƒ»∞ÅôΩπ—]ï•ù°–ËÄ‡‘¿ÅıÙ˘!Ω‹Å—ºÅÖëêÅ—°îÅπë…Ω•êÅ›•ëùï–ΩÕ’µµÖ…‰¯4(ÄÄÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅµÖ…ù•πQΩ¿ËÄ‡∞ÅôΩπ—M•ÈîËÄƒƒ∏‘∞Å±•πï!ï•ù°–ËÄƒ∏‘‘∞ÅçΩ±Ω»ËÄàå·‹‡‰‘àÅıÙ¯ƒ∏Å1Ωπúµ¡…ïÕÃÅÖ∏Åïµ¡—‰ÅÕ¡ÖçîÅΩ∏ÅÂΩ’»Å°ΩµîÅÕç…ïï∏∏Òâ»º¯»∏ÅQÖ¿ÄÒÕ—…Ωπú˘]•ëùï—ÃΩÕ—…Ωπú¯ÅÖπêÅô•πêÄÒÕ—…Ωπú˘A±’Õ°1•ôîΩÕ—…Ωπú¯∏Òâ»º¯Ã∏Å…ÖúÅ—°îÅ›•ëùï–ÅΩπ—ºÅÂΩ’»Å°ΩµîÅÕç…ïï∏∏Ωë•ÿ¯4(ÄÄÄÄÄÄÄÄΩëï—Ö•±Ã¯4(ÄÄÄÄÄÄΩÖ…ê¯4(ÄÄÄÄº¯4(ÄÄ§Ï4(4(ÄÅçΩπÕ–Å…ïÕ–ÄÙÄ†4(ÄÄÄÄ¯4(ÄÄÄÄÄÄÒï—Ö•±!ïÖëï»Å—•—±îÙâIïÕ–ÄòÅYÖçÖ—•Ω∏àÅΩπ	Öç¨ıÏ†§ÄÙ¯ÅÕï—Mïç—•Ω∏†â°Ωµîà•ÙÄº¯4(ÄÄÄÄÄÄÒMïç—•ΩπQ•—±îÅ•çΩ∏Ùã¬~2–àÅ—•—±îÙâA…Ω—ïç—ïêÅ…ïÕ–àÅëïÕç…•¡—•Ω∏ÙâAÖ’ÕîÅ—°îÅ±•Õ–ÅÖπêÅ…ïµ•πëï…ÃÅ›•—°Ω’–Åï…ÖÕ•πúÅ¡…Ωù…ïÕÃ∏àÄº¯4(ÄÄÄÄÄÄÒÖ…ê¯4(ÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅë•Õ¡±Ö‰ËÄâô±ï‡à∞Å©’Õ—•ôÂΩπ—ïπ–ËÄâÕ¡Öçîµâï—›ïï∏à∞ÅùÖ¿ËÄƒ»∞ÅÖ±•ùπ%—ïµÃËÄâçïπ—ï»àÅıÙ¯4(ÄÄÄÄÄÄÄÄÄÄÒë•ÿ¯4(ÄÄÄÄÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅôΩπ—M•ÈîËÄƒÃ∏‘∞ÅôΩπ—]ï•ù°–ËÄ‰¿¿∞ÅçΩ±Ω»ËÄàå—‹‘ŸàÅıÙ˘IïÕ–Å—ΩëÖ‰Ωë•ÿ¯4(ÄÄÄÄÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅµÖ…ù•πQΩ¿ËÄÃ∞ÅôΩπ—M•ÈîËÄƒƒ∏‘∞ÅçΩ±Ω»ËÄàå‡ƒ‰»·àÅıÙ˘9Ω—°•πúÅ•ÃÅ…ï≈’•…ïêÅ—ΩëÖ‰∏Ωë•ÿ¯4(ÄÄÄÄÄÄÄÄÄÄΩë•ÿ¯4(ÄÄÄÄÄÄÄÄÄÄÒâ’——Ω∏Å—Â¡îÙââ’——Ω∏àÅΩπ±•ç¨ıÌ—Ωùù±ïIïÕ—QΩëÖÂÙÅÕ—Â±îıÌÏÄ∏∏πÕïçΩπëÖ…Â	’——Ω∏∞ÅâΩ…ëï»ËÅ…ïÕ—Ö—ïÕMï–π°ÖÃ°¡ï…•ΩêπëÖ—î§Ä¸Äà…¡‡ÅÕΩ±•êÄåÃ‡·‹‰àÄËÅÕïçΩπëÖ…Â	’——Ω∏πâΩ…ëï»∞ÅçΩ±Ω»ËÄàåÃ‡·‹‰àÅıÙ˘Ì…ïÕ—Ö—ïÕMï–π°ÖÃ°¡ï…•ΩêπëÖ—î§Ä¸ÄãärLÅIïÕ—•πúàÄËÄâQ’…∏ÅΩ∏âÙΩâ’——Ω∏¯4(ÄÄÄÄÄÄÄÄΩë•ÿ¯4(ÄÄÄÄÄÄΩÖ…ê¯4(ÄÄÄÄÄÄÒÖ…ê¯4(ÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅôΩπ—M•ÈîËÄƒÃ∏‘∞ÅôΩπ—]ï•ù°–ËÄ‰¿¿∞ÅçΩ±Ω»ËÄàå—‹‘ŸàÅıÙ˘A±Ö∏ÅÑÅ…ïÕ–Å…ÖπùîΩë•ÿ¯4(ÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅë•Õ¡±Ö‰ËÄâù…•êà∞Åù…•ëQïµ¡±Ö—ïΩ±’µπÃËÄà≈ô»Ä≈ô»à∞ÅùÖ¿ËÄ‡∞ÅµÖ…ù•πQΩ¿ËÄ‰ÅıÙ¯4(ÄÄÄÄÄÄÄÄÄÄÒ±Öâï∞ÅÕ—Â±îıÌÏÅôΩπ—M•ÈîËÄƒƒ∏‘∞ÅôΩπ—]ï•ù°–ËÄ‡¿¿∞ÅçΩ±Ω»ËÄàåŸ‡ƒ›àÅıÙ˘…Ω¥Ò•π¡’–Å—Â¡îÙâëÖ—îàÅŸÖ±’îıÌ…ïÕ—IÖπùï…Öô–πÕ—Ö…—ÙÅΩπ°ÖπùîıÏ°ïŸïπ–§ÄÙ¯ÅÕï—IïÕ—IÖπùï…Öô–†°ç’……ïπ–§ÄÙ¯Ä°ÏÄ∏∏πç’……ïπ–∞ÅÕ—Ö…–ËÅïŸïπ–π—Ö…ùï–πŸÖ±’îÅÙ§•ÙÅÕ—Â±îıÌÏÄ∏∏π•π¡’—M—Â±î∞ÅµÖ…ù•πQΩ¿ËÄ‘ÅıÙÄº¯Ω±Öâï∞¯4(ÄÄÄÄÄÄÄÄÄÄÒ±Öâï∞ÅÕ—Â±îıÌÏÅôΩπ—M•ÈîËÄƒƒ∏‘∞ÅôΩπ—]ï•ù°–ËÄ‡¿¿∞ÅçΩ±Ω»ËÄàåŸ‡ƒ›àÅıÙ˘QºÒ•π¡’–Å—Â¡îÙâëÖ—îàÅŸÖ±’îıÌ…ïÕ—IÖπùï…Öô–πïπëÙÅΩπ°ÖπùîıÏ°ïŸïπ–§ÄÙ¯ÅÕï—IïÕ—IÖπùï…Öô–†°ç’……ïπ–§ÄÙ¯Ä°ÏÄ∏∏πç’……ïπ–∞ÅïπêËÅïŸïπ–π—Ö…ùï–πŸÖ±’îÅÙ§•ÙÅÕ—Â±îıÌÏÄ∏∏π•π¡’—M—Â±î∞ÅµÖ…ù•πQΩ¿ËÄ‘ÅıÙÄº¯Ω±Öâï∞¯4(ÄÄÄÄÄÄÄÄΩë•ÿ¯4(ÄÄÄÄÄÄÄÄÒâ’——Ω∏Å—Â¡îÙââ’——Ω∏àÅΩπ±•ç¨ıÌÕÖŸïIïÕ—IÖπùïÙÅÕ—Â±îıÌÏÄ∏∏π¡…•µÖ…Â	’——Ω∏∞ÅµÖ…ù•πQΩ¿ËÄƒ¿∞ÅâÖç≠ù…Ω’πêËÄàåÃ‡·‹‰àÅıÙ˘5Ö…¨ÅÖÃÅ…ïÕ—•πúΩâ’——Ω∏¯4(ÄÄÄÄÄÄÄÅÌ…ïÕ—Ö—ïÃπ±ïπù—†Ä¯Ä¿ÄòòÄÒë•ÿÅÕ—Â±îıÌÏÅµÖ…ù•πQΩ¿ËÄ‡∞ÅçΩ±Ω»ËÄàå‡ƒ‰»·à∞ÅôΩπ—M•ÈîËÄƒƒ∏‘ÅıÙ˘Ì…ïÕ—Ö—ïÃπ±ïπù—°ÙÅ…ïÕ–ÅÌ…ïÕ—Ö—ïÃπ±ïπù—†ÄÙÙÙÄƒÄ¸ÄâëÖ‰àÄËÄâëÖÂÃâÙÅµÖ…≠ïê∏Ωë•ÿ˘Ù4(ÄÄÄÄÄÄΩÖ…ê¯4(ÄÄÄÄº¯4(ÄÄ§Ï4(4(ÄÅçΩπÕ–Å¡…•ŸÖç‰ÄÙÄ†4(ÄÄÄÄ¯4(ÄÄÄÄÄÄÒï—Ö•±!ïÖëï»Å—•—±îÙâA…•ŸÖç‰ÄòÅÖ—ÑàÅΩπ	Öç¨ıÏ†§ÄÙ¯ÅÕï—Mïç—•Ω∏†â°Ωµîà•ÙÄº¯4(ÄÄÄÄÄÄÒMïç—•ΩπQ•—±îÅ•çΩ∏Ùã¬~R@àÅ—•—±îÙâeΩ’»ÅëÖ—ÑÅÕ—ÖÂÃÅÂΩ’…ÃàÅëïÕç…•¡—•Ω∏Ùâ	Öç≠’¿∞Å…ïÕ—Ω…î∞ÅΩ»Å…ïµΩŸîÅÕ¡ïç•ô•åÅçÖ—ïùΩ…•ïÃ∏àÄº¯4(ÄÄÄÄÄÄÒÖ…êÅÕ—Â±îıÌÏÅâÖç≠ù…Ω’πêËÄàç’	‰à∞ÅâΩ…ëï…Ω±Ω»ËÄàç›àÅıÙ¯4(ÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅë•Õ¡±Ö‰ËÄâô±ï‡à∞Å©’Õ—•ôÂΩπ—ïπ–ËÄâÕ¡Öçîµâï—›ïï∏à∞ÅùÖ¿ËÄƒ»∞ÅÖ±•ùπ%—ïµÃËÄâçïπ—ï»àÅıÙ¯4(ÄÄÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅµ•π]•ë—†ËÄ¿ÅıÙ¯4(ÄÄÄÄÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅôΩπ—M•ÈîËÄƒÃ∏‘∞ÅôΩπ—]ï•ù°–ËÄ‰¿¿∞ÅçΩ±Ω»ËÄàåÃ–‹‡ÿ‘àÅıÙ˚¬~NƒÅ=∏µëïŸ•çîÅâÖç≠’¿Ωë•ÿ¯4(ÄÄÄÄÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅµÖ…ù•πQΩ¿ËÄ–∞ÅçΩ±Ω»ËÄàåŸ‡ƒ›à∞ÅôΩπ—M•ÈîËÄƒƒ∏‘∞Å±•πï!ï•ù°–ËÄƒ∏–‘ÅıÙ˘A±’Õ°1•ôîÅ≠ïï¡ÃÅÑÅÕïçΩπêÅçΩ¡‰ÅΩòÅÂΩ’»Å•πëï¡ïπëïπ—±‰Å…ïÕ—Ω…Öâ±îÅëÖ—ÑÅΩ∏Å—°•ÃÅëïŸ•çî∏Å±Ω’êÅÕÂπåÅÕ—ÖÂÃÅΩ∏ÅÕºÅÑÅπï‹Å¡°ΩπîÅçÖ∏ÅÕ—•±∞Å…ïçΩŸï»ÅÂΩ’»ÅÖççΩ’π–∏Ωë•ÿ¯4(ÄÄÄÄÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅµÖ…ù•πQΩ¿ËÄÿ∞ÅçΩ±Ω»ËÅëïŸ•çï	Öç≠’¡M—Ö—’Ã¸πÕ—Ö±îÄ¸Äàç‘Ÿƒ–àÄËÄàå‘ÿ‹‘Ÿà∞ÅôΩπ—M•ÈîËÄƒƒ∞ÅôΩπ—]ï•ù°–ËÄ‡¿¿ÅıÙ¯4(ÄÄÄÄÄÄÄÄÄÄÄÄÄÅÌëïŸ•çï	Öç≠’¡M—Ö—’Ã¸πÕÖŸïë–Ä¸Ä°ëïŸ•çï	Öç≠’¡M—Ö—’ÃπÕ—Ö±îÄ¸Äâ	Öç≠’¿ÅπïïëÃÅ…ïô…ïÕ°•πúÉ
‹Å±ÖÕ–ÅÕÖŸïêÄàÄËÄâ1ÖÕ–ÅÕÖŸïêÄà§Ä¨Åπï‹ÅÖ—î°ëïŸ•çï	Öç≠’¡M—Ö—’ÃπÕÖŸïë–§π—Ω1ΩçÖ±ïM—…•πú†§ÄËÅëïŸ•çï	Öç≠’¡M—Ö—’Ã¸π’πÖŸÖ•±Öâ±îÄ¸Äâ=∏µëïŸ•çîÅâÖç≠’¿Å’πÖŸÖ•±Öâ±îÅΩ∏Å—°•ÃÅëïŸ•çîàÄËÄâ]Ö•—•πúÅôΩ»Å—°îÅô•…Õ–ÅΩ∏µëïŸ•çîÅâÖç≠’¿âÙ4(ÄÄÄÄÄÄÄÄÄÄÄÄΩë•ÿ¯4(ÄÄÄÄÄÄÄÄÄÄÄÅÌëïŸ•çï	Öç≠’¡M—Ö—’Ã¸πï·•Õ—ÃÄòòÄÒë•ÿÅÕ—Â±îıÌÏÅµÖ…ù•πQΩ¿ËÄÃ∞ÅçΩ±Ω»ËÄàå‹ƒ‡‘›à∞ÅôΩπ—M•ÈîËÄƒ¿∏‘∞Å±•πï!ï•ù°–ËÄƒ∏–ÅıÙ˘ÌëïŸ•çï	Öç≠’¡M—Ö—’ÃπŸï…•ô•ïêÄ¸ÄãärLÅ1Ö—ïÕ–ÅâÖç≠’¿ÅŸï…•ô•ïêàÄËÄâYï…•ô•çÖ—•Ω∏Å…ïçΩµµïπëïêâÙÉ
‹ÅIïçΩŸï…‰ÅÕπÖ¡Õ°Ω—ÃËÅÌëïŸ•çï	Öç≠’¡M—Ö—’ÃπÕπÖ¡Õ°Ω—Ω’π–ÅÒÄ≈ÙºÃΩë•ÿ˘Ù4(ÄÄÄÄÄÄÄÄÄÄΩë•ÿ¯4(ÄÄÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅë•Õ¡±Ö‰ËÄâù…•êà∞ÅùÖ¿ËÄÿ∞Åô±ï·M°…•π¨ËÄ¿ÅıÙ¯4(ÄÄÄÄÄÄÄÄÄÄÄÄÒâ’——Ω∏Å—Â¡îÙââ’——Ω∏àÅë•ÕÖâ±ïêıÌëïŸ•çï	Öç≠’¡	’ÕÂÙÅΩπ±•ç¨ıÌ…ïô…ïÕ°ïŸ•çï	Öç≠’¡ÙÅÕ—Â±îıÌÏÄ∏∏πÕïçΩπëÖ…Â	’——Ω∏∞ÅçΩ±Ω»ËÄàåÃ–‹‡ÿ‘à∞ÅΩ¡Öç•—‰ËÅëïŸ•çï	Öç≠’¡	’Õ‰Ä¸Ä∏ÿ‘ÄËÄƒÅıÙ˘ÌëïŸ•çï	Öç≠’¡	’Õ‰Ä¸ÄâMÖŸ•πüäòàÄËÄâ	Öç¨Å’¿ÅπΩ‹âÙΩâ’——Ω∏¯4(ÄÄÄÄÄÄÄÄÄÄÄÄÒâ’——Ω∏Å—Â¡îÙââ’——Ω∏àÅë•ÕÖâ±ïêıÌëïŸ•çï	Öç≠’¡Yï…•ôÂ	’Õ‰ÅÒÄÖëïŸ•çï	Öç≠’¡M—Ö—’Ã¸πï·•Õ—ÕÙÅΩπ±•ç¨ıÌŸï…•ôÂïŸ•çï	Öç≠’¡9Ω›ÙÅÕ—Â±îıÌÏÄ∏∏πÕïçΩπëÖ…Â	’——Ω∏∞ÅçΩ±Ω»ËÄàåÕ‹·‡à∞ÅΩ¡Öç•—‰ËÄ°ëïŸ•çï	Öç≠’¡Yï…•ôÂ	’Õ‰ÅÒÄÖëïŸ•çï	Öç≠’¡M—Ö—’Ã¸πï·•Õ—Ã§Ä¸Ä∏‘‘ÄËÄƒÅıÙ˘ÌëïŸ•çï	Öç≠’¡Yï…•ôÂ	’Õ‰Ä¸ÄâYï…•ôÂ•πüäòàÄËÄâYï…•ô‰ÅâÖç≠’¿âÙΩâ’——Ω∏¯4(ÄÄÄÄÄÄÄÄÄÄΩë•ÿ¯4(ÄÄÄÄÄÄÄÄΩë•ÿ¯4(ÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅµÖ…ù•πQΩ¿ËÄ‰∞Å¡Öëë•πúËÄà·¡‡ÄÂ¡‡à∞ÅâΩ…ëï…IÖë•’ÃËÄƒ¿∞ÅâÖç≠ù…Ω’πêËÄâ…ùâÑ†»‘‘∞»‘‘∞»‘‘∞∏‹§à∞ÅçΩ±Ω»ËÄàå‹ƒ‡‘›à∞ÅôΩπ—M•ÈîËÄƒ¿∏‡∞Å±•πï!ï•ù°–ËÄƒ∏–‘ÅıÙ˘A±’Õ°1•ôîÅ≠ïï¡ÃÅ’¿Å—ºÄÃÅ…ïçïπ–Å…ïçΩŸï…‰ÅÕπÖ¡Õ°Ω—ÃÅΩ∏Å—°•ÃÅëïŸ•çî∏Å9Ω—°•πúÅ•ÃÅëï±ï—ïêÅô…Ω¥Å—°îÅç±Ω’êÅÖ’—ΩµÖ—•çÖ±±‰∏ÅIï±Ö—•ΩπÕ°•¿∞Å¡ÖÂµïπ–∞Å¡’Õ†µ—Ω≠ï∏∞ÅÖπêÅëïŸ•çîµ¡Ö•…•πúÅ…ïçΩ…ëÃÅÖ…îÅëï±•âï…Ö—ï±‰ÅπΩ–ÅçΩ¡•ïêÅ•π—ºÅ—°îÅ…ïÕ—Ω…Öâ±îÅëïŸ•çîÅâÖç≠’¿∏Ωë•ÿ¯4(ÄÄÄÄÄÄΩÖ…ê¯4(ÄÄÄÄÄÄÒÖ…êÅÕ—Â±îıÌÏÅâÖç≠ù…Ω’πêËÄàç·	à∞ÅâΩ…ëï…Ω±Ω»ËÄàçÂÂÿàÅıÙ¯4(ÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅôΩπ—M•ÈîËÄƒÃ∏‘∞ÅôΩπ—]ï•ù°–ËÄ‰¿¿∞ÅçΩ±Ω»ËÄàåÕ‹·‡àÅıÙ˚¬~RHÅ]îÅ›•±∞ÅπïŸï»ÅÕï±∞ÅÂΩ’»ÅëÖ—Ñ∏ÅŸï»∏Ωë•ÿ¯4(ÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅµÖ…ù•πQΩ¿ËÄ–∞ÅçΩ±Ω»ËÄàåÿ‰‡’Ãà∞ÅôΩπ—M•ÈîËÄƒƒ∏‘∞Å±•πï!ï•ù°–ËÄƒ∏–‘ÅıÙ˘9ºÅëÖ—ÑÅâ…Ω≠ï…ÃÅÖπêÅπºÅÕÖ±îÅΩòÅÂΩ’»Å°Öâ•—Ã∞ÅµΩΩëÃ∞ÅΩ»Å…ïô±ïç—•ΩπÃ∏Ωë•ÿ¯4(ÄÄÄÄÄÄΩÖ…ê¯4(ÄÄÄÄÄÄÒÖ…ê¯4(ÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅë•Õ¡±Ö‰ËÄâù…•êà∞ÅùÖ¿ËÄ‡ÅıÙ¯4(ÄÄÄÄÄÄÄÄÄÄÒâ’——Ω∏Å—Â¡îÙââ’——Ω∏àÅΩπ±•ç¨ıÌï·¡Ω…—5ÂÖ—ÖÙÅÕ—Â±îıÌÏÄ∏∏πÕïçΩπëÖ…Â	’——Ω∏∞Å—ï·—±•ù∏ËÄâ±ïô–àÅıÙ˚ä≤æ‚<ÅΩ›π±ΩÖêÅµ‰ÅëÖ—ÑΩâ’——Ω∏¯4(ÄÄÄÄÄÄÄÄÄÄÒâ’——Ω∏Å—Â¡îÙââ’——Ω∏àÅΩπ±•ç¨ıÏ†§ÄÙ¯Å…ïÕ—Ω…ï•±ï%π¡’—Iïòπç’……ïπ–¸πç±•ç¨†•ÙÅÕ—Â±îıÌÏÄ∏∏πÕïçΩπëÖ…Â	’——Ω∏∞Å—ï·—±•ù∏ËÄâ±ïô–àÅıÙ˚ä≤æ‚<ÅIïÕ—Ω…îÅô…Ω¥ÅâÖç≠’¿Ωâ’——Ω∏¯4(ÄÄÄÄÄÄÄÄÄÄÒ•π¡’–Å…ïòıÌ…ïÕ—Ω…ï•±ï%π¡’—IïôÙÅ—Â¡îÙâô•±îàÅÖççï¡–ÙâÖ¡¡±•çÖ—•Ω∏Ω©ÕΩ∏àÅÕ—Â±îıÌÏÅë•Õ¡±Ö‰ËÄâπΩπîàÅıÙÅΩπ°ÖπùîıÏ°ïŸïπ–§ÄÙ¯ÅÏÅçΩπÕ–Åô•±îÄÙÅïŸïπ–π—Ö…ùï–πô•±ïÃ¸πl¡tÏÅïŸïπ–π—Ö…ùï–πŸÖ±’îÄÙÄààÏÅ•òÄ°ô•±î§Å…ïÕ—Ω…ï…Ωµ	Öç≠’¿°ô•±î§ÏÅıÙÄº¯4(ÄÄÄÄÄÄÄÄΩë•ÿ¯4(ÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅµÖ…ù•πQΩ¿ËÄ‡∞ÅçΩ±Ω»ËÄàå·‹‡‰‘à∞ÅôΩπ—M•ÈîËÄƒƒ∏‘∞Å±•πï!ï•ù°–ËÄƒ∏–‘ÅıÙ˘	Öç≠’¡ÃÅ•πç±’ëîÅÂΩ’»ÅΩ›∏Å—ÖÕ≠Ã∞ÅÕç°ïë’±ïÃ∞Å¡…Ωù…ïÕÃ∞ÅÖπêÅ…ïô±ïç—•ΩπÃ∏Å’Ö…ë•Ö∏ÅçΩππïç—•ΩπÃÅÖ…îÅπΩ–Å•πç±’ëïê∏Ωë•ÿ¯4(ÄÄÄÄÄÄΩÖ…ê¯4(ÄÄÄÄÄÄÒÖ…ê¯4(ÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅôΩπ—M•ÈîËÄƒ»∞ÅôΩπ—]ï•ù°–ËÄ‰¿¿∞ÅçΩ±Ω»ËÄàçÿ’‹¿àÅıÙ˘1QÅM=5Å=Å5dÅQΩë•ÿ¯4(ÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅµÖ…ù•πQΩ¿ËÄ–∞ÅôΩπ—M•ÈîËÄƒƒ∏‘∞ÅçΩ±Ω»ËÄàå·‹‡‰‘àÅıÙ˘Q°ïÕîÅ±ïÖŸîÅÂΩ’»ÅÖççΩ’π–∞Å—ÖÕ≠Ã∞ÅÖπêÅ…Ω’—•πïÃÅ•∏Å¡±Öçî∏Ωë•ÿ¯4(ÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅë•Õ¡±Ö‰ËÄâù…•êà∞ÅùÖ¿ËÄ‡∞ÅµÖ…ù•πQΩ¿ËÄƒ¿ÅıÙ¯4(ÄÄÄÄÄÄÄÄÄÄÒâ’——Ω∏Å—Â¡îÙââ’——Ω∏àÅΩπ±•ç¨ıÌëï±ï—ï±±°ïç≠%πÕÙÅÕ—Â±îıÌÏÄ∏∏πÕïçΩπëÖ…Â	’——Ω∏∞ÅçΩ±Ω»ËÄàçÿ’‹¿àÅıÙ˘ï±ï—îÅÖ±∞Åç°ïç¨µ•πÃΩâ’——Ω∏¯4(ÄÄÄÄÄÄÄÄÄÄÒâ’——Ω∏Å—Â¡îÙââ’——Ω∏àÅΩπ±•ç¨ıÌëï±ï—ï±±Iïô±ïç—•ΩπÕÙÅÕ—Â±îıÌÏÄ∏∏πÕïçΩπëÖ…Â	’——Ω∏∞ÅçΩ±Ω»ËÄàçÿ’‹¿àÅıÙ˘ï±ï—îÅÖ±∞Å…ïô±ïç—•ΩπÃΩâ’——Ω∏¯4(ÄÄÄÄÄÄÄÄΩë•ÿ¯4(ÄÄÄÄÄÄΩÖ…ê¯4(ÄÄÄÄº¯4(ÄÄ§Ï4(4(ÄÅçΩπÕ–ÅÕ’¡¡Ω…–ÄÙÄ†4(ÄÄÄÄ¯4(ÄÄÄÄÄÄÒï—Ö•±!ïÖëï»Å—•—±îÙâ!ï±¿ÄòÅïïëâÖç¨àÅΩπ	Öç¨ıÏ†§ÄÙ¯ÅÕï—Mïç—•Ω∏†â°Ωµîà•ÙÄº¯4(ÄÄÄÄÄÄÒMïç—•ΩπQ•—±îÅ•çΩ∏Ùã¬~J∞àÅ—•—±îÙâQï±∞Å’ÃÅ›°Ö–Åôïï±ÃÅΩôòàÅëïÕç…•¡—•Ω∏Ùâ	’úÅ…ï¡Ω…—ÃÅÖπêÅôïïëâÖç¨ÅùºÅÕ—…Ö•ù°–Å—ºÅ—°îÅ¡ï…ÕΩ∏ÅµÖ•π—Ö•π•πúÅA±’Õ°1•ôî∏àÄº¯4(ÄÄÄÄÄÄÒÖ…ê¯4(ÄÄÄÄÄÄÄÄÒ—ï·—Ö…ïÑÅŸÖ±’îıÌôïïëâÖç≠Qï·—ÙÅΩπ°ÖπùîıÏ°ïŸïπ–§ÄÙ¯ÅÕï—ïïëâÖç≠Qï·–°ïŸïπ–π—Ö…ùï–πŸÖ±’î•ÙÅµÖ·1ïπù—†ıÏ»¿¿¡ÙÅ¡±Öçï°Ω±ëï»Ùâ]°Ö–ùÃÅùΩ•πúÅΩ∏¸àÅÕ—Â±îıÌÏÄ∏∏π•π¡’—M—Â±î∞Åµ•π!ï•ù°–ËÄƒ»¿∞Å…ïÕ•ÈîËÄâŸï…—•çÖ∞à∞ÅôΩπ—Öµ•±‰ËÄâ•π°ï…•–àÅıÙÄº¯4(ÄÄÄÄÄÄÄÄÒâ’——Ω∏Å—Â¡îÙââ’——Ω∏àÅΩπ±•ç¨ıÌÕ’âµ•—ïïëâÖç≠ÙÅÕ—Â±îıÌÏÄ∏∏π¡…•µÖ…Â	’——Ω∏∞ÅµÖ…ù•πQΩ¿ËÄ‰ÅıÙ˚¬~J0ÅMïπêÅôïïëâÖç¨Ωâ’——Ω∏¯4(ÄÄÄÄÄÄÄÅÌôïïëâÖç≠5ïÕÕÖùîÄòòÄÒë•ÿÅ…Ω±îÙâÕ—Ö—’ÃàÅÕ—Â±îıÌÏÅµÖ…ù•πQΩ¿ËÄ‹∞ÅçΩ±Ω»ËÄàå‹‘’‡»à∞ÅôΩπ—M•ÈîËÄƒƒ∏‘ÅıÙ˘ÌôïïëâÖç≠5ïÕÕÖùïÙΩë•ÿ˘Ù4(ÄÄÄÄÄÄΩÖ…ê¯4(ÄÄÄÄº¯4(ÄÄ§Ï4(4(ÄÅçΩπÕ–ÅùΩ±êÄÙÄ†4(ÄÄÄÄ¯4(ÄÄÄÄÄÄÒï—Ö•±!ïÖëï»Å—•—±îÙâA±’Õ†ÅΩ±êÅA…ïŸ•ï‹àÅΩπ	Öç¨ıÏ†§ÄÙ¯ÅÕï—Mïç—•Ω∏†â°Ωµîà•ÙÄº¯4(ÄÄÄÄÄÄÒA±’Õ°Ω±ëA…ïŸ•ï‹Äº¯4(ÄÄÄÄº¯4(ÄÄ§Ï4(4(ÄÅçΩπÕ–ÅÖççΩ’π–ÄÙÄ†4(ÄÄÄÄ¯4(ÄÄÄÄÄÄÒï—Ö•±!ïÖëï»Å—•—±îÙâççΩ’π–àÅΩπ	Öç¨ıÏ†§ÄÙ¯ÅÕï—Mïç—•Ω∏†â°Ωµîà•ÙÄº¯4(ÄÄÄÄÄÄÒMïç—•ΩπQ•—±îÅ•çΩ∏Ùã¬~RDàÅ—•—±îÙâççΩ’π–ÄòÅÕÂπåàÅëïÕç…•¡—•Ω∏Ùâ5ÖπÖùîÅÂΩ’»ÅïµÖ•∞∞ÅÕïÕÕ•ΩπÃ∞ÅÖπêÅÖççΩ’π–ÅçΩπ—…Ω±Ã∏àÄº¯4(ÄÄÄÄÄÄÒÖ…ê¯4(ÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅôΩπ—M•ÈîËÄƒƒ∏‘∞ÅçΩ±Ω»ËÄàå·‹‡‰‘àÅıÙ˘M%9Å%8ÅLΩë•ÿ¯4(ÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅµÖ…ù•πQΩ¿ËÄÃ∞ÅôΩπ—M•ÈîËÄƒ–∞ÅôΩπ—]ï•ù°–ËÄ‰¿¿∞ÅçΩ±Ω»ËÄàå’—Ÿà∞ÅΩŸï…ô±Ω›]…Ö¿ËÄâÖπÂ›°ï…îàÅıÙ˘Ì’Õï»¸πïµÖ•∞ÅÒÄãäPâÙΩë•ÿ¯4(ÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅµÖ…ù•πQΩ¿ËÄƒ¿∞Å¡Öëë•πúËÄàƒ¡¡‡Äƒ≈¡‡à∞ÅâΩ…ëï…IÖë•’ÃËÄƒƒ∞ÅâÖç≠ù…Ω’πêËÅΩπ±•πîÄòòÅÕÂπçM—Ö—’ÃÄÑÙÙÄâΩôô±•πîàÄ¸Äàç¡ÿàÄËÄàç›»à∞ÅçΩ±Ω»ËÅΩπ±•πîÄòòÅÕÂπçM—Ö—’ÃÄÑÙÙÄâΩôô±•πîàÄ¸ÄàåÃ–‹‡ÿ‘àÄËÄàåÂŸ—à∞ÅôΩπ—M•ÈîËÄƒƒ∏‘∞ÅôΩπ—]ï•ù°–ËÄ‹‘¿ÅıÙ˘ÌôΩ…µÖ—MÂπçM—Ö—’Ã°Ωπ±•πî∞ÅÕÂπçM—Ö—’Ã∞Å±ÖÕ—MÂπçïë–•ÙΩë•ÿ¯4(ÄÄÄÄÄÄÄÄÒâ’——Ω∏Å—Â¡îÙââ’——Ω∏àÅΩπ±•ç¨ıÌÕÂπç9Ω›ÙÅÕ—Â±îıÌÏÄ∏∏πÕïçΩπëÖ…Â	’——Ω∏∞ÅµÖ…ù•πQΩ¿ËÄ‡ÅıÙ˘ÌÕÂπçM—Ö—’ÃÄÙÙÙÄâï……Ω»àÄ¸ÄâIï—…‰ÅÕÂπåàÄËÄâMÂπåÅπΩ‹âÙΩâ’——Ω∏¯4(ÄÄÄÄÄÄΩÖ…ê¯4(ÄÄÄÄÄÄÒÖ…ê¯4(ÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅôΩπ—M•ÈîËÄƒ»∞ÅôΩπ—]ï•ù°–ËÄ‰¿¿∞ÅçΩ±Ω»ËÄàåÿÿ‘–‹–àÅıÙ˘!9Å5%0Ωë•ÿ¯4(ÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅë•Õ¡±Ö‰ËÄâù…•êà∞Åù…•ëQïµ¡±Ö—ïΩ±’µπÃËÄâµ•πµÖ‡†¿∞≈ô»§ÅÖ’—ºà∞ÅùÖ¿ËÄ‡∞ÅµÖ…ù•πQΩ¿ËÄ‡ÅıÙ¯4(ÄÄÄÄÄÄÄÄÄÄÒ•π¡’–Å—Â¡îÙâïµÖ•∞àÅŸÖ±’îıÌïµÖ•±°Öπùï…Öô—ÙÅΩπ°ÖπùîıÏ°ïŸïπ–§ÄÙ¯ÅÕï—µÖ•±°Öπùï…Öô–°ïŸïπ–π—Ö…ùï–πŸÖ±’î•ÙÅ¡±Öçï°Ω±ëï»Ùâ9ï‹ÅïµÖ•∞ÅÖëë…ïÕÃàÅÕ—Â±îıÌ•π¡’—M—Â±ïÙÄº¯4(ÄÄÄÄÄÄÄÄÄÄÒâ’——Ω∏Å—Â¡îÙââ’——Ω∏àÅΩπ±•ç¨ıÌ…ï≈’ïÕ—µÖ•±°ÖπùïÙÅÕ—Â±îıÌÏÄ∏∏π¡…•µÖ…Â	’——Ω∏∞ÅâÖç≠ù…Ω’πêËÄàå—·‡àÅıÙ˘°ÖπùîΩâ’——Ω∏¯4(ÄÄÄÄÄÄÄÄΩë•ÿ¯4(ÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅµÖ…ù•πQΩ¿ËÄÿ∞ÅôΩπ—M•ÈîËÄƒƒ∞Å±•πï!ï•ù°–ËÄƒ∏–∞ÅçΩ±Ω»ËÄàå·‹‡‰‘àÅıÙ˘Ω»ÅÕïç’…•—‰∞ÅçΩπô•…µÖ—•Ω∏Å±•π≠ÃÅÖ…îÅÕïπ–ÅâïôΩ…îÅ—°îÅÖëë…ïÕÃÅç°ÖπùïÃ∏Ωë•ÿ¯4(ÄÄÄÄÄÄΩÖ…ê¯4(ÄÄÄÄÄÄÒÖ…ê¯4(ÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅë•Õ¡±Ö‰ËÄâù…•êà∞ÅùÖ¿ËÄ‡ÅıÙ¯4(ÄÄÄÄÄÄÄÄÄÄÒâ’——Ω∏Å—Â¡îÙââ’——Ω∏àÅë•ÕÖâ±ïêıÌÕ•ùπ•πù=’—ÙÅΩπ±•ç¨ıÏ†§ÄÙ¯ÅÏÅŸΩ•êÅ°Öπë±ïM•ùπ=’–†§ÏÅıÙÅÕ—Â±îıÌÏÄ∏∏πÕïçΩπëÖ…Â	’——Ω∏∞Å—ï·—±•ù∏ËÄâ±ïô–à∞ÅΩ¡Öç•—‰ËÅÕ•ùπ•πù=’–Ä¸Ä∏ÿÄËÄƒÅıÙ˚¬~j®ÅÌÕ•ùπ•πù=’–Ä¸ÄâM•ùπ•πúÅΩ’”äòàÄËÄâM•ù∏ÅΩ’–âÙΩâ’——Ω∏¯4(ÄÄÄÄÄÄÄÄÄÄÒâ’——Ω∏Å—Â¡îÙââ’——Ω∏àÅΩπ±•ç¨ıÌÕ•ùπ=’—=—°ï…ïŸ•çïÕÙÅÕ—Â±îıÌÏÄ∏∏πÕïçΩπëÖ…Â	’——Ω∏∞Å—ï·—±•ù∏ËÄâ±ïô–à∞ÅçΩ±Ω»ËÄàçÿ’‹¿àÅıÙ˘M•ù∏ÅΩ’–ÅΩ—°ï»ÅëïŸ•çïÃΩâ’——Ω∏¯4(ÄÄÄÄÄÄÄÄΩë•ÿ¯4(ÄÄÄÄÄÄΩÖ…ê¯4(ÄÄÄÄÄÄÒÖ…êÅÕ—Â±îıÌÏÅâΩ…ëï…Ω±Ω»ËÄàçÿàÅıÙ¯4(ÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅôΩπ—M•ÈîËÄƒ»∞ÅôΩπ—]ï•ù°–ËÄ‰¿¿∞ÅçΩ±Ω»ËÄàçÿ’‹¿àÅıÙ˘9HÅi=9Ωë•ÿ¯4(ÄÄÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅµÖ…ù•πQΩ¿ËÄ–∞ÅôΩπ—M•ÈîËÄƒƒ∏‘∞ÅçΩ±Ω»ËÄàå·‹‡‰‘àÅıÙ˘ï±ï—•πúÅÂΩ’»ÅÖççΩ’π–Å…ï≈’•…ïÃÅçΩπô•…µÖ—•Ω∏ÅÖπêÅçÖππΩ–ÅâîÅ’πëΩπî∏Ωë•ÿ¯4(ÄÄÄÄÄÄÄÄÒâ’——Ω∏Å—Â¡îÙââ’——Ω∏àÅΩπ±•ç¨ıÌëï±ï—ï5ÂççΩ’π—ÙÅÕ—Â±îıÌÏÄ∏∏πÕïçΩπëÖ…Â	’——Ω∏∞ÅµÖ…ù•πQΩ¿ËÄ‰∞ÅçΩ±Ω»ËÄàçÿ’‹¿à∞ÅâΩ…ëï…Ω±Ω»ËÄàçŸ…àÅıÙ˘ï±ï—îÅÖççΩ’π–Ωâ’——Ω∏¯4(ÄÄÄÄÄÄΩÖ…ê¯4(ÄÄÄÄÄÅÌÕï——•πùÕ5ïÕÕÖùîÄòòÄÒë•ÿÅ…Ω±îÙâÕ—Ö—’ÃàÅÕ—Â±îıÌÏÅµÖ…ù•πQΩ¿ËÄƒ¿∞ÅçΩ±Ω»ËÄàåÃ–‹‡ÿ‘à∞ÅôΩπ—M•ÈîËÄƒ»∞ÅôΩπ—]ï•ù°–ËÄ‡¿¿ÅıÙ˘ÌÕï——•πùÕ5ïÕÕÖùïÙΩë•ÿ˘Ù4(ÄÄÄÄº¯4(ÄÄ§Ï4(4(ÄÅçΩπÕ–Å¡ÖùïÃÄÙÅÏÅ°Ωµî∞Å¡ï…ÕΩπÖ±•Èî∞ÅπΩ—•ô•çÖ—•ΩπÃ∞Åï·¡ï…•ïπçî∞ÅëïŸ•çïÃ∞Å…ïÕ–∞Å¡…•ŸÖç‰∞ÅÕ’¡¡Ω…–∞ÅùΩ±ê∞ÅÖççΩ’π–ÅÙÏ4(4(ÄÅ…ï—’…∏Ä†4(ÄÄÄÄÒQΩΩ±AÖπï∞Å—•—±îÙâMï——•πùÃàÅΩπ±ΩÕîıÌΩπ±ΩÕïÙ¯4(ÄÄÄÄÄÄÒë•ÿÅÕ—Â±îıÌÏÅµÖ·]•ë—†ËÄÿ»¿∞ÅµÖ…ù•∏ËÄà¿ÅÖ’—ºàÅıÙ˘Ì¡ÖùïÕmÕïç—•ΩπtÅÒÅ°ΩµïÙΩë•ÿ¯4(ÄÄÄÄΩQΩΩ±AÖπï∞¯4(ÄÄ§Ï4)Ù4(