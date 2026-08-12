export function HabitHealth({ weeklyOverallPct = 0, weeklyEssentialPct = 0, caringDays = 0, weekOverWeekDelta = null, preferences = {}, goToDashboard, openTaskManager }) {
  const [open, setOpen] = React.useState(false);
  const trendLabel = weekOverWeekDelta === null ? "New week" : weekOverWeekDelta > 0 ? `+${weekOverWeekDelta}%` : weekOverWeekDelta < 0 ? `${weekOverWeekDelta}%` : "Steady";
  const rhythm = caringDays >= 5 ? "Strong rhythm" : caringDays >= 3 ? "Building rhythm" : caringDays >= 1 ? "Getting started" : "Fresh start";
  const nextMove = weeklyEssentialPct >= 80
    ? "Protect what is already working. You do not need to add another habit just because this week went well."
    : weeklyEssentialPct >= 50
      ? "Keep the habits that matter most and make one harder habit a little easier to start."
      : caringDays > 0
        ? "Shrink the plan before blaming yourself. Fewer, clearer habits usually beat a bigger list you avoid."
        : "Pick one tiny habit for today. A useful first repeat matters more than a perfect plan.";

  return (
    <section style={{ marginBottom: 12, borderRadius: 17, border: "1px solid #CFE8E1", background: "linear-gradient(145deg,#F3FFFB,#FFFAFD)", overflow: "hidden", boxShadow: "0 6px 20px rgba(49,140,121,.07)" }}>
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center", padding: "13px 14px", border: 0, background: "transparent", textAlign: "left", cursor: "pointer" }}>
        <span>
          <span style={{ display: "block", fontSize: 10.5, letterSpacing: ".13em", fontWeight: 900, color: "#318C79" }}>📊 THIS WEEK</span>
          <span style={{ display: "block", marginTop: 3, fontSize: 14.5, fontWeight: 900, color: "#4F405C" }}>{rhythm} · {weeklyOverallPct}% this week</span>
          <span style={{ display: "block", marginTop: 2, fontSize: 11.5, lineHeight: 1.4, color: "#71857F" }}>Consistency without punishing broken streaks.</span>
        </span>
        <span aria-hidden="true" style={{ fontSize: 20, color: "#6FAE9D" }}>{open ? "▾" : "›"}</span>
      </button>

      {open && <div style={{ padding: "0 14px 14px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 7 }}>
          <div style={{ padding: "9px 7px", borderRadius: 11, background: "rgba(255,255,255,.82)", textAlign: "center" }}><div style={{ fontSize: 17, fontWeight: 900, color: "#318C79" }}>{caringDays}</div><div style={{ marginTop: 2, fontSize: 9.5, color: "#71857F" }}>CARING DAYS</div></div>
          <div style={{ padding: "9px 7px", borderRadius: 11, background: "rgba(255,255,255,.82)", textAlign: "center" }}><div style={{ fontSize: 17, fontWeight: 900, color: "#A65DC1" }}>{weeklyEssentialPct}%</div><div style={{ marginTop: 2, fontSize: 9.5, color: "#806B8D" }}>ESSENTIALS</div></div>
          <div style={{ padding: "9px 7px", borderRadius: 11, background: "rgba(255,255,255,.82)", textAlign: "center" }}><div style={{ fontSize: 17, fontWeight: 900, color: weekOverWeekDelta != null && weekOverWeekDelta < 0 ? "#8C6B9E" : "#4C8FE8" }}>{trendLabel}</div><div style={{ marginTop: 2, fontSize: 9.5, color: "#71857F" }}>VS LAST WEEK</div></div>
        </div>
        <div style={{ marginTop: 9, padding: "10px 11px", borderRadius: 11, background: "rgba(255,255,255,.72)", color: "#5E706A", fontSize: 11.5, lineHeight: 1.5 }}><strong>Best next move:</strong> {nextMove}</div>
        {preferences.gentle_streaks && <div style={{ marginTop: 7, fontSize: 10.5, lineHeight: 1.45, color: "#71857F" }}>Gentle consistency is on: missed days stay visible as information, not failure.</div>}
        <div style={{ display: "flex", gap: 7, marginTop: 9, flexWrap: "wrap" }}>
          <button type="button" onClick={() => goToDashboard?.("today")} style={{ padding: "7px 10px", borderRadius: 9, border: 0, background: "#318C79", color: "white", fontWeight: 900, cursor: "pointer" }}>Do one thing now</button>
          <button type="button" onClick={() => openTaskManager?.()} style={{ padding: "7px 10px", borderRadius: 9, border: "1px solid #A9D8CB", background: "white", color: "#318C79", fontWeight: 900, cursor: "pointer" }}>Adjust my habits</button>
        </div>
      </div>}
    </section>
  );
}
