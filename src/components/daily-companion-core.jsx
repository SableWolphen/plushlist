const { useEffect, useState } = React;

const FIRST_SEEN_KEY = "plushlife:companion:first-seen:v1";
const HISTORY_KEY = "plushlife:companion:history:v1";

function safeRead(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch (_error) {
    return fallback;
  }
}

function safeWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (_error) {
    // Companion features are optional; the core tracker still works if storage is unavailable.
  }
}

function dateDiffDays(a, b) {
  const start = new Date(`${a}T12:00:00`);
  const end = new Date(`${b}T12:00:00`);
  return Math.max(0, Math.round((end - start) / 86400000));
}

function sectionButton(label, icon, open, onClick) {
  return (
    <button type="button" onClick={onClick} aria-expanded={open} style={{ width: "100%", display: "flex", alignItems: "center", gap: 10, padding: "11px 12px", borderRadius: 12, border: "1px solid #E6D4F2", background: open ? "#FAF2FD" : "#FFFFFFD9", color: "#5B4B6B", cursor: "pointer", textAlign: "left" }}>
      <span style={{ fontSize: 18, width: 26, textAlign: "center" }}>{icon}</span>
      <span style={{ flex: 1, fontWeight: 900, fontSize: 12.5 }}>{label}</span>
      <span aria-hidden="true" style={{ color: "#9A86A7", fontWeight: 900 }}>{open ? "▾" : "›"}</span>
    </button>
  );
}

export function DailyCompanion({ open, period, rows = [], viewDone = {}, dailyCheckIn = {}, pct = 0, returnGapDays = 0, nextStepTask, selectDayType, toggleRestToday, openTaskManager, openJournalForSelectedDate, setCareSection, goToDashboard }) {
  const dateKey = period?.date || new Date().toISOString().slice(0, 10);
  const [openSection, setOpenSection] = useState("");
  const [gentleDone, setGentleDone] = useState(() => safeRead(`plushlife:gentle-day:${dateKey}`, {}));
  const [windDown, setWindDown] = useState(() => safeRead(`plushlife:wind-down:${dateKey}`, { feeling: "", win: "", carry: "" }));
  const [supportNeed, setSupportNeed] = useState(() => safeRead(`plushlife:support-need:${dateKey}`, ""));
  const [savedMessage, setSavedMessage] = useState("");
  const [firstSeen] = useState(() => {
    const existing = safeRead(FIRST_SEEN_KEY, "");
    if (existing) return existing;
    safeWrite(FIRST_SEEN_KEY, dateKey);
    return dateKey;
  });

  useEffect(() => {
    setGentleDone(safeRead(`plushlife:gentle-day:${dateKey}`, {}));
    setWindDown(safeRead(`plushlife:wind-down:${dateKey}`, { feeling: "", win: "", carry: "" }));
    setSupportNeed(safeRead(`plushlife:support-need:${dateKey}`, ""));
  }, [dateKey]);

  useEffect(() => {
    if (!open) return;
    const history = safeRead(HISTORY_KEY, []);
    const completed = rows.filter((row) => !!viewDone[row.key]).length;
    const snapshot = {
      date: dateKey,
      pct: Number.isFinite(pct) ? pct : 0,
      completed,
      total: rows.length,
      dayType: dailyCheckIn.day_type || "full",
      mood: dailyCheckIn.mood || "",
      energy: dailyCheckIn.energy || "",
    };
    const next = [snapshot, ...history.filter((item) => item?.date && item.date !== dateKey)]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 45);
    safeWrite(HISTORY_KEY, next);
  }, [open, dateKey, pct, rows, viewDone, dailyCheckIn.day_type, dailyCheckIn.mood, dailyCheckIn.energy]);

  const firstWeekElapsed = dateDiffDays(firstSeen, dateKey) + 1;
  const firstWeekDay = Math.min(7, firstWeekElapsed);
  const inFirstWeek = firstWeekElapsed <= 7;
  const incomplete = rows.filter((row) => !viewDone[row.key] && !row.isBonus);
  const heavyMood = ["tired", "stressed", "anxious", "sad", "lonely", "overwhelmed", "numb", "sick"].includes(dailyCheckIn.mood);
  const lowCapacity = ["very_low", "low"].includes(dailyCheckIn.capacity) || ["empty", "low"].includes(dailyCheckIn.energy);
  const canSuggestGentler = (dailyCheckIn.day_type || "full") === "full" && (heavyMood || lowCapacity || incomplete.length >= 8);
  const suggestedDayType = ["very_low"].includes(dailyCheckIn.capacity) || ["empty"].includes(dailyCheckIn.energy) || ["overwhelmed", "numb", "sick"].includes(dailyCheckIn.mood) ? "tiny" : "soft";

  if (!open) return null;

  const gentleItems = [
    ["drink", "🥤", "Drink something"],
    ["food", "🍞", "Eat something easy"],
    ["body", "🧼", "Do one body-care thing"],
    ["pause", "🌿", "Pause, breathe, or rest for a minute"],
  ];

  const firstWeekTips = [
    ["🌸", "Start with Today", "You do not need to learn everything at once. Today is the home base."],
    ["🙂", "Try a quick check-in", "Mood and energy help PlushLife suggest a kinder day without taking control away from you."],
    ["🎯", "Use One Next Step", "When the list feels noisy, let PlushLife surface one useful next thing."],
    ["🔔", "Set one reminder", "One well-timed reminder is usually better than a pile of notifications."],
    ["🌱", "Try a Tiny or Soft Day", "Lower-capacity days can still count without pretending you have full energy."],
    ["🧰", "Browse starter packs", "Morning, bedtime, hygiene, and other routine packs can save setup time."],
    ["💜", "Make it yours", "Keep what helps, hide what does not, and let PlushLife fit your life instead of the other way around."],
  ];
  const [firstWeekIcon, firstWeekTitle, firstWeekText] = firstWeekTips[firstWeekDay - 1];

  const toggleSection = (id) => setOpenSection((current) => current === id ? "" : id);
  const openCare = () => {
    setCareSection?.("quick");
    goToDashboard?.("care");
  };

  return (
    <div style={{ marginTop: 18, marginBottom: 18, padding: 14, borderRadius: 18, background: "linear-gradient(145deg,#FFF9FD,#F5FBFF)", border: "1px solid #E3C9EC", boxShadow: "0 8px 24px rgba(118,85,138,.08)" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div style={{ fontSize: 10.5, letterSpacing: ".14em", fontWeight: 900, color: "#A65DC1" }}>✨ PLUSHCOMPANION</div>
          <div style={{ marginTop: 3, fontSize: 16, fontWeight: 900, color: "#4F405C" }}>A few helpful things, only when you want them</div>
          <div style={{ marginTop: 4, fontSize: 11.5, lineHeight: 1.45, color: "#806B8D" }}>Gentle Day, quick actions, evening reset, routine shortcuts, and support all live here instead of becoming more tabs.</div>
        </div>
      </div>

      {canSuggestGentler && (
        <div style={{ marginTop: 12, padding: "10px 11px", borderRadius: 12, background: "#F2FFFB", border: "1px solid #BFE5D2", color: "#416B61" }}>
          <div style={{ fontSize: 11.5, fontWeight: 900 }}>🌱 Today looks like it may deserve less pressure.</div>
          <div style={{ marginTop: 3, fontSize: 11.5, lineHeight: 1.45 }}>You still choose. PlushLife can switch today to a {suggestedDayType === "tiny" ? "Tiny" : "Soft"} Day and keep the rest of your progress intact.</div>
          <button type="button" onClick={() => selectDayType?.(suggestedDayType)} style={{ marginTop: 7, padding: "7px 10px", borderRadius: 9, border: 0, background: "#318C79", color: "white", fontWeight: 900, cursor: "pointer" }}>Use a {suggestedDayType === "tiny" ? "Tiny" : "Soft"} Day</button>
        </div>
      )}

      {returnGapDays >= 2 && (
        <div style={{ marginTop: 10, padding: "9px 11px", borderRadius: 11, background: "#FFF9E9", border: "1px solid #F0D99E", color: "#6B5A3D", fontSize: 11.5, lineHeight: 1.45 }}>
          🧸 Coming back counts. PlushLife only needs you to deal with today—not the days you were away.
        </div>
      )}

      <div style={{ display: "grid", gap: 7, marginTop: 12 }}>
        {sectionButton("Gentle Day", "🌱", openSection === "gentle", () => toggleSection("gentle"))}
        {openSection === "gentle" && (
          <div style={{ padding: "11px 12px", borderRadius: 12, background: "#FFFFFFD9", border: "1px solid #D6EEE7" }}>
            <div style={{ fontSize: 11.5, lineHeight: 1.5, color: "#607A73" }}>For days when the full list is too much. This does not erase anything and does not create a streak penalty.</div>
            <div style={{ display: "flex", gap: 7, marginTop: 9, flexWrap: "wrap" }}>
              <button type="button" onClick={() => selectDayType?.("tiny")} style={{ padding: "7px 10px", borderRadius: 9, border: 0, background: "#318C79", color: "white", fontWeight: 900, cursor: "pointer" }}>Use Tiny Day</button>
              <button type="button" onClick={() => selectDayType?.("soft")} style={{ padding: "7px 10px", borderRadius: 9, border: "1px solid #9ED8CB", background: "white", color: "#318C79", fontWeight: 900, cursor: "pointer" }}>Use Soft Day</button>
            </div>
            <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
              {gentleItems.map(([id, icon, label]) => (
                <label key={id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 9px", borderRadius: 10, background: gentleDone[id] ? "#F1FFF9" : "#FAFCFB", color: "#4F625D", fontSize: 12, fontWeight: 800 }}>
                  <input type="checkbox" checked={!!gentleDone[id]} onChange={(event) => {
                    const next = { ...gentleDone, [id]: event.target.checked };
                    setGentleDone(next);
                    safeWrite(`plushlife:gentle-day:${dateKey}`, next);
                  }} />
                  <span>{icon}</span><span>{label}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {sectionButton("Quick Add & shortcuts", "＋", openSection === "quick", () => toggleSection("quick"))}
        {openSection === "quick" && (
          <div style={{ padding: "11px 12px", borderRadius: 12, background: "#FFFFFFD9", border: "1px solid #E6D4F2" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2,minmax(0,1fr))", gap: 7 }}>
              <button type="button" onClick={() => openTaskManager?.()} style={{ padding: "10px 8px", borderRadius: 10, border: "1px solid #DCC9E8", background: "white", color: "#6B5A7D", fontWeight: 900, cursor: "pointer" }}>＋ Add a task</button>
              <button type="button" onClick={() => openJournalForSelectedDate?.()} style={{ padding: "10px 8px", borderRadius: 10, border: "1px solid #DCC9E8", background: "white", color: "#6B5A7D", fontWeight: 900, cursor: "pointer" }}>✍️ Journal note</button>
              <button type="button" onClick={() => toggleRestToday?.()} style={{ padding: "10px 8px", borderRadius: 10, border: "1px solid #CFE8E1", background: "white", color: "#318C79", fontWeight: 900, cursor: "pointer" }}>🌴 Rest today</button>
              <button type="button" onClick={openCare} style={{ padding: "10px 8px", borderRadius: 10, border: "1px solid #CFE8E1", background: "white", color: "#318C79", fontWeight: 900, cursor: "pointer" }}>♥ Need support</button>
            </div>
            {nextStepTask && <div style={{ marginTop: 8, fontSize: 11.5, color: "#806B8D" }}>🎯 Your current best next step is <strong>{nextStepTask.label}</strong>. The full One Next Step controls stay above in Today.</div>}
          </div>
        )}

        {sectionButton("Routine starter packs", "🧰", openSection === "routines", () => toggleSection("routines"))}
        {openSection === "routines" && (
          <div style={{ padding: "11px 12px", borderRadius: 12, background: "#FFFFFFD9", border: "1px solid #D6EEE7" }}>
            <div style={{ fontSize: 11.5, lineHeight: 1.5, color: "#607A73" }}>PlushLife already has editable starter packs in Change my tasks. Add only the missing tasks, then customize them like anything else.</div>
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              {(window.PlushLifeContent?.TEMPLATE_PACKS || []).slice(0, 5).map((pack) => <span key={pack.id} style={{ padding: "5px 8px", borderRadius: 999, background: "#F2FFFB", color: "#3E746A", fontSize: 10.5, fontWeight: 800 }}>{pack.emoji} {pack.label}</span>)}
            </div>
            <button type="button" onClick={() => openTaskManager?.()} style={{ marginTop: 9, padding: "7px 10px", borderRadius: 9, border: 0, background: "#318C79", color: "white", fontWeight: 900, cursor: "pointer" }}>Browse starter packs</button>
          </div>
        )}

        {sectionButton("Evening reset", "🌙", openSection === "evening", () => toggleSection("evening"))}
        {openSection === "evening" && (
          <div style={{ padding: "11px 12px", borderRadius: 12, background: "linear-gradient(150deg,#F7F5FF,#FFF9FD)", border: "1px solid #DCC9E8" }}>
            <div style={{ fontSize: 11.5, lineHeight: 1.5, color: "#6B5A7D" }}>Thirty seconds is enough. This is a private local reset, not journaling homework.</div>
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              {["rough", "okay", "good"].map((feeling) => <button key={feeling} type="button" aria-pressed={windDown.feeling === feeling} onClick={() => setWindDown((current) => ({ ...current, feeling }))} style={{ padding: "6px 9px", borderRadius: 999, border: windDown.feeling === feeling ? "2px solid #A65DC1" : "1px solid #DCC9E8", background: windDown.feeling === feeling ? "#F7ECFB" : "white", color: "#76558A", fontWeight: 800, cursor: "pointer" }}>{feeling === "rough" ? "😮‍💨 Rough" : feeling === "okay" ? "🙂 Okay" : "💜 Good"}</button>)}
            </div>
            <label style={{ display: "grid", gap: 4, marginTop: 9, fontSize: 10.5, fontWeight: 900, color: "#76558A" }}>ONE WIN · OPTIONAL<input value={windDown.win} onChange={(event) => setWindDown((current) => ({ ...current, win: event.target.value }))} maxLength={240} placeholder="Something that counted today" style={{ padding: 9, borderRadius: 9, border: "1px solid #DCC9E8" }} /></label>
            <label style={{ display: "grid", gap: 4, marginTop: 8, fontSize: 10.5, fontWeight: 900, color: "#76558A" }}>CARRY INTO TOMORROW · OPTIONAL<input value={windDown.carry} onChange={(event) => setWindDown((current) => ({ ...current, carry: event.target.value }))} maxLength={240} placeholder="One thing to remember tomorrow" style={{ padding: 9, borderRadius: 9, border: "1px solid #DCC9E8" }} /></label>
            <button type="button" onClick={() => { safeWrite(`plushlife:wind-down:${dateKey}`, windDown); setSavedMessage("Evening reset saved privately on this device. 🌙"); window.setTimeout(() => setSavedMessage(""), 2500); }} style={{ marginTop: 9, padding: "7px 10px", borderRadius: 9, border: 0, background: "#A65DC1", color: "white", fontWeight: 900, cursor: "pointer" }}>Save reset</button>
            {savedMessage && <div role="status" style={{ marginTop: 6, fontSize: 11, color: "#76558A" }}>{savedMessage}</div>}
          </div>
        )}

        {sectionButton("Ask for a little support", "🤝", openSection === "support", () => toggleSection("support"))}
        {openSection === "support" && (
          <div style={{ padding: "11px 12px", borderRadius: 12, background: "#FFFFFFD9", border: "1px solid #D6EEE7" }}>
            <div style={{ fontSize: 11.5, color: "#607A73", lineHeight: 1.45 }}>Choose what would help. PlushLife keeps the choice yours and sends you to the existing private care/support flow rather than posting anything publicly.</div>
            <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
              {["Encouragement", "Check on me", "Quiet company", "Practical help"].map((need) => <button key={need} type="button" aria-pressed={supportNeed === need} onClick={() => { setSupportNeed(need); safeWrite(`plushlife:support-need:${dateKey}`, need); }} style={{ padding: "6px 9px", borderRadius: 999, border: supportNeed === need ? "2px solid #318C79" : "1px solid #CFE8E1", background: supportNeed === need ? "#EEF9F6" : "white", color: "#318C79", fontWeight: 800, cursor: "pointer" }}>{need}</button>)}
            </div>
            <button type="button" onClick={openCare} style={{ marginTop: 9, padding: "7px 10px", borderRadius: 9, border: 0, background: "#318C79", color: "white", fontWeight: 900, cursor: "pointer" }}>Open private support tools</button>
          </div>
        )}

        {inFirstWeek && sectionButton(`First-week guide · Day ${firstWeekDay}`, firstWeekIcon, openSection === "firstweek", () => toggleSection("firstweek"))}
        {inFirstWeek && openSection === "firstweek" && (
          <div style={{ padding: "11px 12px", borderRadius: 12, background: "#FFF9EFD9", border: "1px solid #F0D99E" }}>
            <div style={{ fontSize: 12.5, fontWeight: 900, color: "#6B5A3D" }}>{firstWeekTitle}</div>
            <div style={{ marginTop: 4, fontSize: 11.5, lineHeight: 1.5, color: "#7B6B50" }}>{firstWeekText}</div>
          </div>
        )}
      </div>
    </div>
  );
}
