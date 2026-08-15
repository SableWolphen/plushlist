import { addCaringDay, caringStreak, clearFutureNote, getFutureNote, localDay, monthlyMoments, recordMoment, registerVisit, rescueSignal, saveFutureNote } from "../plush-memory.js";

const card = { borderRadius: 14, border: "1px solid #E3D6EC", background: "linear-gradient(145deg,#FFF9FD,#F7FCFA)", padding: "11px 12px", boxShadow: "0 3px 12px rgba(96,62,112,.05)" };
const button = { minHeight: 44, padding: "7px 10px", borderRadius: 10, border: "1px solid #D8C5E3", background: "white", color: "#765F84", fontWeight: 900, fontSize: 10.5, cursor: "pointer" };

function hasCheckIn(checkIn) { return Boolean(checkIn && (checkIn.mood || checkIn.energy || checkIn.capacity || checkIn.day_type)); }

export function PlushKnowsMe({ user, rows = [], viewDone = {}, dailyCheckIn = {}, dailyCheckInHistory = [], goToDashboard }) {
  const userId = user?.id || "local";
  const [visit] = React.useState(() => registerVisit(userId));
  const [futureNote, setFutureNote] = React.useState(() => getFutureNote(userId));
  const [editingNote, setEditingNote] = React.useState(false);
  const [noteDraft, setNoteDraft] = React.useState(futureNote?.text || "");
  const [rescueDismissed, setRescueDismissed] = React.useState(false);
  const completed = rows.filter((row) => !row.isBonus && !!viewDone?.[row.key]).length;
  const signal = rescueSignal({ rows, viewDone, dailyCheckIn });

  React.useEffect(() => {
    const today = localDay();
    if (hasCheckIn(dailyCheckIn)) {
      addCaringDay(userId, today, "check-in");
      recordMoment(userId, "You checked in with yourself instead of having to guess what kind of day this was.", "check-in", today);
    }
    if (completed > 0) {
      addCaringDay(userId, today, "one-step");
      if (completed === 1) recordMoment(userId, "You did one caring step. One still counts.", "task", today);
    }
  }, [userId, dailyCheckIn?.mood, dailyCheckIn?.energy, dailyCheckIn?.capacity, completed]);

  const historyDates = (Array.isArray(dailyCheckInHistory) ? dailyCheckInHistory : []).map((entry) => entry?.check_date).filter(Boolean);
  if (hasCheckIn(dailyCheckIn)) historyDates.push(localDay());
  const streak = caringStreak(userId, historyDates);
  const moments = monthlyMoments(userId);
  const rough = ["empty", "low"].includes(dailyCheckIn?.energy) || ["very_low", "low"].includes(dailyCheckIn?.capacity) || ["overwhelmed", "anxious", "sad", "numb", "sick", "stressed"].includes(dailyCheckIn?.mood);
  const showReturn = visit.gapDays >= 3;
  const showFuture = Boolean(futureNote?.text && rough);

  const openRescue = () => {
    try { document.getElementById("plushlife-gentle-launcher")?.click(); } catch {}
    addCaringDay(userId, localDay(), "rescue");
    recordMoment(userId, "You chose to make the day smaller instead of forcing the full version.", "rescue");
  };

  const saveNote = () => {
    const next = saveFutureNote(userId, noteDraft);
    setFutureNote(next); setEditingNote(false);
  };

  return <section data-plush-knows-me="true" aria-label="PlushMemory" style={{ display: "grid", gap: 8, margin: "8px 0 10px" }}>
    {showReturn && <div style={{ ...card, borderColor: "#CFE8E1", background: "linear-gradient(145deg,#F2FFFB,#FFF9FD)" }}>
      <div style={{ fontSize: 12.2, fontWeight: 900, color: "#4D8174" }}>🧸 Hi. Your stuff is still here.</div>
      <div style={{ marginTop: 3, fontSize: 10.7, lineHeight: 1.45, color: "#71857F" }}>It has been a few days. There is nothing to catch up on. You can make today tiny and start from right now.</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 7 }}><button type="button" onClick={openRescue} style={{ ...button, border: 0, background: "#4D9A86", color: "white" }}>🌿 Make today smaller</button><button type="button" onClick={() => goToDashboard?.("care")} style={button}>💜 Open PlushCare</button></div>
    </div>}

    {signal.shouldOffer && !rescueDismissed && <div style={{ ...card, borderColor: "#D9C9EB", background: "linear-gradient(145deg,#F8F2FF,#FFFFFF)" }}>
      <div style={{ fontSize: 9.7, letterSpacing: ".11em", fontWeight: 900, color: "#8E4EAA" }}>🫧 PLUSHMEMORY NOTICED</div>
      <div style={{ marginTop: 4, fontSize: 12, fontWeight: 900, color: "#5B4B6B" }}>Want me to make today smaller?</div>
      <div style={{ marginTop: 3, fontSize: 10.5, lineHeight: 1.45, color: "#806B8D" }}>{signal.reason}</div>
      <div style={{ marginTop: 4, fontSize: 9.7, color: "#9A86A5" }}>Nothing is deleted. This only changes what the day asks you to look at right now.</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 7 }}><button type="button" onClick={openRescue} style={{ ...button, border: 0, background: "#8E69B1", color: "white" }}>Yes, make it smaller</button><button type="button" onClick={() => setRescueDismissed(true)} style={button}>Not now</button></div>
    </div>}

    <div style={{ ...card, padding: "9px 11px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8, alignItems: "center" }}><div><div style={{ fontSize: 10.7, fontWeight: 900, color: "#765F84" }}>💞 Care streak · {streak} {streak === 1 ? "day" : "days"}</div><div style={{ marginTop: 2, fontSize: 9.8, lineHeight: 1.4, color: "#8C7A96" }}>Check-ins, one caring step, rest, and asking for help can all count. This is not a productivity streak.</div></div></div>
    </div>

    {showFuture && <div style={{ ...card, borderColor: "#E9D7B1", background: "#FFFDF4" }}><div style={{ fontSize: 10.7, fontWeight: 900, color: "#8F6A24" }}>💌 A note from a steadier you</div><div style={{ marginTop: 5, fontSize: 11.2, lineHeight: 1.48, color: "#695A3C" }}>“{futureNote.text}”</div></div>}

    <details style={{ ...card, padding: "7px 10px" }}>
      <summary style={{ minHeight: 44, display: "flex", alignItems: "center", cursor: "pointer", color: "#765F84", fontSize: 10.7, fontWeight: 900 }}>💌 Future Me note</summary>
      <div style={{ fontSize: 9.8, lineHeight: 1.4, color: "#8C7A96" }}>Leave one thing you want PlushLife to remind you of on a rough day.</div>
      {editingNote || !futureNote ? <><textarea value={noteDraft} onChange={(event)=>setNoteDraft(event.target.value)} placeholder="When I feel like this, it helps to…" maxLength={420} style={{ width: "100%", minHeight: 78, boxSizing: "border-box", marginTop: 7, padding: 9, borderRadius: 10, border: "1px solid #DEC8EA", resize: "vertical", font: "inherit", fontSize: 11 }} /><div style={{ display: "flex", gap: 6, marginTop: 6 }}><button type="button" onClick={saveNote} style={button}>Save note</button>{futureNote && <button type="button" onClick={()=>{setEditingNote(false);setNoteDraft(futureNote.text);}} style={button}>Cancel</button>}</div></> : <div style={{ marginTop: 6 }}><div style={{ padding: 8, borderRadius: 9, background: "white", fontSize: 10.7, color: "#6B5A7D" }}>{futureNote.text}</div><div style={{ display: "flex", gap: 6, marginTop: 6 }}><button type="button" onClick={()=>setEditingNote(true)} style={button}>Edit</button><button type="button" onClick={()=>{clearFutureNote(userId);setFutureNote(null);setNoteDraft("");setEditingNote(true);}} style={button}>Clear</button></div></div>}
    </details>

    {moments.length > 0 && <details style={{ ...card, padding: "7px 10px" }}><summary style={{ minHeight: 44, display: "flex", alignItems: "center", cursor: "pointer", color: "#765F84", fontSize: 10.7, fontWeight: 900 }}>✨ PlushMoments · this month</summary><div style={{ display: "grid", gap: 5, marginTop: 5 }}>{moments.slice(0,4).map((moment)=><div key={moment.fingerprint} style={{ padding: "7px 8px", borderRadius: 9, background: "white", fontSize: 10.2, lineHeight: 1.4, color: "#7B6888" }}>{moment.text}</div>)}</div></details>}
  </section>;
}
