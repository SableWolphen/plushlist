import { addCaringDay, caringStreak, clearFutureNote, dayForecast, getFutureNote, localDay, monthlyMoments, recordMoment, registerVisit, rescueSignal, saveFutureNote } from "../plush-memory.js";
import { forgetPattern, getBoundaries, plushProfileSummary, profileContext, recordRecommendationOutcome, setBoundary, weeklyMemoryUpdate } from "../plush-profile.js";
import { hasGoldFeature } from "../plush-gold.js";

const card = { borderRadius: 14, border: "1px solid #E3D6EC", background: "linear-gradient(145deg,#FFF9FD,#F7FCFA)", padding: "11px 12px", boxShadow: "0 3px 12px rgba(96,62,112,.05)" };
const button = { minHeight: 44, padding: "7px 10px", borderRadius: 10, border: "1px solid #D8C5E3", background: "white", color: "#765F84", fontWeight: 900, fontSize: 10.5, cursor: "pointer" };

function hasCheckIn(checkIn) { return Boolean(checkIn && (checkIn.mood || checkIn.energy || checkIn.capacity || checkIn.day_type)); }
function prettyPattern(item) {
  const names = { care: "care support", sleep: "sleep support", rescue: "making the day smaller", forecast: "Day Forecast", path: "PlushPath pacing" };
  const raw = String(item?.recommendationId || "this support").replace(/^.*?·\s*/, "").replace(/[-_]+/g, " ");
  return `${names[item?.kind] || item?.kind || "support"}: ${raw}`;
}

function FeedbackRow({ onFeedback, label = "Did that fit?" }) {
  return <div style={{ marginTop: 7 }}><div style={{ fontSize: 9.6, fontWeight: 900, color: "#8A7894" }}>{label}</div><div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 4 }}><button type="button" onClick={() => onFeedback("helped")} style={button}>💜 Yes</button><button type="button" onClick={() => onFeedback("neutral")} style={button}>🙂 Not sure</button><button type="button" onClick={() => onFeedback("not_helpful")} style={button}>🪶 Not really</button></div></div>;
}

export function PlushKnowsMe({ user, rows = [], viewDone = {}, dailyCheckIn = {}, dailyCheckInHistory = [], goToDashboard }) {
  const userId = user?.id || "local";
  const goldMemory = hasGoldFeature("advanced_growth_insights");
  const [visit] = React.useState(() => registerVisit(userId));
  const [futureNote, setFutureNote] = React.useState(() => getFutureNote(userId));
  const [editingNote, setEditingNote] = React.useState(false);
  const [noteDraft, setNoteDraft] = React.useState(futureNote?.text || "");
  const [rescueDismissed, setRescueDismissed] = React.useState(false);
  const [feedbackTarget, setFeedbackTarget] = React.useState(null);
  const [profileVersion, setProfileVersion] = React.useState(0);
  const [boundaries, setBoundaries] = React.useState(() => getBoundaries(userId));
  const completed = rows.filter((row) => !row.isBonus && !!viewDone?.[row.key]).length;
  const signal = rescueSignal({ rows, viewDone, dailyCheckIn });
  const forecast = dayForecast({ rows, viewDone, dailyCheckIn });
  const context = profileContext({ dailyCheckIn, rows, viewDone });
  const profile = plushProfileSummary(userId);
  const weekly = weeklyMemoryUpdate(userId);
  void profileVersion;

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

  const recordFit = (kind, recommendationId, feedback) => {
    recordRecommendationOutcome(userId, kind, recommendationId, feedback, context);
    setFeedbackTarget(null);
    setProfileVersion((value) => value + 1);
  };

  const openRescue = (source = "rescue") => {
    try { document.getElementById("plushlife-gentle-launcher")?.click(); } catch {}
    addCaringDay(userId, localDay(), "rescue");
    recordMoment(userId, "You chose to make the day smaller instead of forcing the full version.", "rescue");
    setFeedbackTarget(source);
  };

  const saveNote = () => { const next = saveFutureNote(userId, noteDraft); setFutureNote(next); setEditingNote(false); };
  const changeBoundary = (name, enabled) => { const next = setBoundary(userId, name, enabled); setBoundaries({ ...next }); };

  return <section data-plush-knows-me="true" aria-label="PlushMemory" style={{ display: "grid", gap: 8, margin: "8px 0 10px" }}>
    {showReturn && <div style={{ ...card, borderColor: "#CFE8E1", background: "linear-gradient(145deg,#F2FFFB,#FFF9FD)" }}><div style={{ fontSize: 12.2, fontWeight: 900, color: "#4D8174" }}>🧸 Hi. Your stuff is still here.</div><div style={{ marginTop: 3, fontSize: 10.7, lineHeight: 1.45, color: "#71857F" }}>It has been a few days. There is nothing to catch up on. You can make today tiny and start from right now.</div><div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 7 }}><button type="button" onClick={() => openRescue("return")} style={{ ...button, border: 0, background: "#4D9A86", color: "white" }}>🌿 Make today smaller</button><button type="button" onClick={() => goToDashboard?.("care")} style={button}>💜 Open PlushCare</button></div>{feedbackTarget === "return" && <FeedbackRow label="Was that a good way to come back?" onFeedback={(feedback) => recordFit("rescue", "return-after-break", feedback)} />}</div>}

    <div data-plush-day-forecast="true" style={{ ...card, borderColor: forecast.mode === "tiny" ? "#CFE8E1" : "#D7DCEF", background: forecast.mode === "tiny" ? "linear-gradient(145deg,#F2FFFB,#FFFFFF)" : "linear-gradient(145deg,#F8F9FF,#FFFFFF)" }}><div style={{ fontSize: 9.5, letterSpacing: ".11em", fontWeight: 900, color: "#6675A2" }}>🌦️ DAY FORECAST</div><div style={{ marginTop: 4, fontSize: 11.7, fontWeight: 900, color: "#5B5973" }}>{forecast.icon} {forecast.title}</div><div style={{ marginTop: 3, fontSize: 10.3, lineHeight: 1.43, color: "#77758A" }}>{forecast.text}</div>{["tiny","soft"].includes(forecast.mode) && <button type="button" onClick={() => openRescue("forecast")} style={{ ...button, marginTop: 7 }}>Make today match this</button>}{feedbackTarget === "forecast" && <FeedbackRow label="Did this forecast fit the day?" onFeedback={(feedback) => recordFit("forecast", forecast.mode, feedback)} />}</div>

    {signal.shouldOffer && !rescueDismissed && <div style={{ ...card, borderColor: "#D9C9EB", background: "linear-gradient(145deg,#F8F2FF,#FFFFFF)" }}><div style={{ fontSize: 9.7, letterSpacing: ".11em", fontWeight: 900, color: "#8E4EAA" }}>🫧 PLUSHMEMORY NOTICED</div><div style={{ marginTop: 4, fontSize: 12, fontWeight: 900, color: "#5B4B6B" }}>Want me to make today smaller?</div><div style={{ marginTop: 3, fontSize: 10.5, lineHeight: 1.45, color: "#806B8D" }}>{signal.reason}</div><div style={{ marginTop: 4, fontSize: 9.7, color: "#9A86A5" }}>Nothing is deleted. This only changes what the day asks you to look at right now.</div><div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 7 }}><button type="button" onClick={() => openRescue("rescue")} style={{ ...button, border: 0, background: "#8E69B1", color: "white" }}>Yes, make it smaller</button><button type="button" onClick={() => setRescueDismissed(true)} style={button}>Not now</button></div>{feedbackTarget === "rescue" && <FeedbackRow label="Did making the day smaller help?" onFeedback={(feedback) => recordFit("rescue", "make-day-smaller", feedback)} />}</div>}

    <div style={{ ...card, padding: "9px 11px" }}><div style={{ fontSize: 10.7, fontWeight: 900, color: "#765F84" }}>💞 Care streak · {streak} {streak === 1 ? "day" : "days"}</div><div style={{ marginTop: 2, fontSize: 9.8, lineHeight: 1.4, color: "#8C7A96" }}>Check-ins, one caring step, rest, and asking for help can all count. This is not a productivity streak.</div></div>

    <details data-plush-profile="true" style={{ ...card, padding: "7px 10px", borderColor: "#D8CBE7" }}>
      <summary style={{ minHeight: 44, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, cursor: "pointer", color: "#684E77", fontSize: 10.9, fontWeight: 900 }}><span>🧸 PlushProfile · What works for me</span>{goldMemory && <span style={{ fontSize: 9, color: "#9B7100" }}>✨ GOLD</span>}</summary>
      <div style={{ fontSize: 9.7, lineHeight: 1.4, color: "#8C7A96" }}>A living profile built from things you actually tried and rated. You can correct it anytime.</div>
      {goldMemory ? <>
        <div style={{ marginTop: 8, fontSize: 10.3, fontWeight: 900, color: "#6B5A7D" }}>What seems to work</div>
        {profile.working.length ? <div style={{ display: "grid", gap: 6, marginTop: 5 }}>{profile.working.map((item) => <div key={item.id} style={{ padding: "8px 9px", borderRadius: 10, background: "white", border: "1px solid #E7DDEF" }}><div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}><strong style={{ fontSize: 10.4, color: "#66536F" }}>{prettyPattern(item)}</strong><span style={{ fontSize: 9.2, color: item.confidence === "Strong fit" ? "#318C79" : "#8E6A38", whiteSpace: "nowrap" }}>{item.confidence}</span></div><div style={{ marginTop: 3, fontSize: 9.7, color: "#8C7A96" }}>{item.helped}/{item.total} clearly helpful{item.context ? ` · often around ${item.context}` : ""}</div><button type="button" onClick={() => { forgetPattern(userId, item.kind, item.recommendationId); setProfileVersion((value) => value + 1); }} style={{ ...button, marginTop: 5 }}>That changed / forget this</button></div>)}</div> : <div style={{ marginTop: 5, padding: 8, borderRadius: 9, background: "white", fontSize: 10.1, color: "#82728C" }}>Still learning. PlushLife needs repeated outcomes before it calls anything a personal fit.</div>}
        <div style={{ marginTop: 9, fontSize: 10.3, fontWeight: 900, color: "#6B5A7D" }}>This week PlushLife updated</div><div style={{ display: "grid", gap: 4, marginTop: 5 }}>{weekly.lines.map((line, index) => <div key={index} style={{ fontSize: 9.9, lineHeight: 1.4, color: "#7B6888" }}>• {line}</div>)}</div>
      </> : <div style={{ marginTop: 7, padding: 8, borderRadius: 9, background: "white", fontSize: 10.1, lineHeight: 1.4, color: "#806B8D" }}>PlushLife keeps the basic care memory gentle and transparent. Gold adds the deeper cross-context pattern profile and weekly memory updates.</div>}
      <div style={{ marginTop: 10, fontSize: 10.3, fontWeight: 900, color: "#6B5A7D" }}>My gentle boundaries</div>
      <div style={{ display: "grid", gap: 5, marginTop: 5 }}>{[["noCatchUpPressure","Never frame missed days as catch-up debt"],["gentlerFirstLowEnergy","Prefer gentler options first on low-energy days"],["avoidAddingOnLowEnergy","Do not suggest adding habits when energy is low"]].map(([name,label]) => <label key={name} style={{ minHeight: 44, display: "flex", gap: 8, alignItems: "center", padding: "6px 8px", borderRadius: 9, background: "white", border: "1px solid #E7DDEF", fontSize: 10, color: "#6F6078", cursor: "pointer" }}><input type="checkbox" checked={Boolean(boundaries[name])} onChange={(event) => changeBoundary(name, event.target.checked)} /> <span>{label}</span></label>)}</div>
    </details>

    {showFuture && <div style={{ ...card, borderColor: "#E9D7B1", background: "#FFFDF4" }}><div style={{ fontSize: 10.7, fontWeight: 900, color: "#8F6A24" }}>💌 A note from a steadier you</div><div style={{ marginTop: 5, fontSize: 11.2, lineHeight: 1.48, color: "#695A3C" }}>“{futureNote.text}”</div></div>}

    <details style={{ ...card, padding: "7px 10px" }}><summary style={{ minHeight: 44, display: "flex", alignItems: "center", cursor: "pointer", color: "#765F84", fontSize: 10.7, fontWeight: 900 }}>💌 Future Me note</summary><div style={{ fontSize: 9.8, lineHeight: 1.4, color: "#8C7A96" }}>Leave one thing you want PlushLife to remind you of on a rough day.</div>{editingNote || !futureNote ? <><textarea value={noteDraft} onChange={(event)=>setNoteDraft(event.target.value)} placeholder="When I feel like this, it helps to…" maxLength={420} style={{ width: "100%", minHeight: 78, boxSizing: "border-box", marginTop: 7, padding: 9, borderRadius: 10, border: "1px solid #DEC8EA", resize: "vertical", font: "inherit", fontSize: 11 }} /><div style={{ display: "flex", gap: 6, marginTop: 6 }}><button type="button" onClick={saveNote} style={button}>Save note</button>{futureNote && <button type="button" onClick={()=>{setEditingNote(false);setNoteDraft(futureNote.text);}} style={button}>Cancel</button>}</div></> : <div style={{ marginTop: 6 }}><div style={{ padding: 8, borderRadius: 9, background: "white", fontSize: 10.7, color: "#6B5A7D" }}>{futureNote.text}</div><div style={{ display: "flex", gap: 6, marginTop: 6 }}><button type="button" onClick={()=>setEditingNote(true)} style={button}>Edit</button><button type="button" onClick={()=>{clearFutureNote(userId);setFutureNote(null);setNoteDraft("");setEditingNote(true);}} style={button}>Clear</button></div></div>}</details>

    {moments.length > 0 && <details style={{ ...card, padding: "7px 10px" }}><summary style={{ minHeight: 44, display: "flex", alignItems: "center", cursor: "pointer", color: "#765F84", fontSize: 10.7, fontWeight: 900 }}>✨ PlushMoments · this month</summary><div style={{ display: "grid", gap: 5, marginTop: 5 }}>{moments.slice(0,4).map((moment)=><div key={moment.fingerprint} style={{ padding: "7px 8px", borderRadius: 9, background: "white", fontSize: 10.2, lineHeight: 1.4, color: "#7B6888" }}>{moment.text}</div>)}</div></details>}
  </section>;
}
