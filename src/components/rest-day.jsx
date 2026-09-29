// Rest day experience — rest as a feature, not an absence.
//
// The rest toggle exists, but a rest day used to render as an empty task
// list. This card makes the brand promise real: a warm rest-day screen with
// a rotating affirmation, suggested rest activities drawn from the existing
// comfort/sleep tools, and the running count of care days.
function pickDaily(list, dateString) {
  if (!Array.isArray(list) || !list.length) return null;
  let hash = 0;
  const seed = String(dateString || "");
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return list[hash % list.length];
}

export function RestDayCard({ careDaysTotal, goToDashboard, period }) {
  const content = window.PlushLifeContent || {};
  const comfortTools = Array.isArray(content.COMFORT_TOOLS) ? content.COMFORT_TOOLS : [];
  const sleepTools = Array.isArray(content.SLEEP_TOOLS) ? content.SLEEP_TOOLS : [];
  const affirmations = Array.isArray(content.GENTLE_AFFIRMATIONS) ? content.GENTLE_AFFIRMATIONS : [];
  const date = period?.date;

  const affirmation = pickDaily(affirmations, date) || "Rest is productive. Today counts.";
  const suggestions = React.useMemo(() => {
    const pool = [...comfortTools, ...sleepTools].filter((tool) => tool && tool.name);
    if (!pool.length) return [];
    let hash = 0;
    const seed = `rest-${date || ""}`;
    for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
    const picks = [];
    const used = new Set();
    for (let n = 0; n < 3 && used.size < pool.length; n += 1) {
      const tool = pool[(hash + n * 7) % pool.length];
      if (used.has(tool.id || tool.name)) continue;
      used.add(tool.id || tool.name);
      picks.push(tool);
    }
    return picks;
  }, [comfortTools.length, sleepTools.length, date]);

  const openCare = () => {
    try { goToDashboard?.("care"); } catch (err) { console.warn("PlushLife: rest-day navigation to care failed", err); }
  };

  return (
    <section aria-label="Rest day" style={{ borderRadius: 22, border: "1px solid #D9E8F5", background: "linear-gradient(145deg,#F7FBFF,#EEF4FB)", boxShadow: "0 8px 26px rgba(70,110,150,.07)", padding: "18px 17px 15px", marginBottom: 12, textAlign: "center" }}>
      <div style={{ fontSize: 34 }} aria-hidden="true">🌙</div>
      <div style={{ marginTop: 6, fontSize: 12, letterSpacing: ".13em", fontWeight: 950, color: "#5B87A8" }}>REST DAY</div>
      <div style={{ marginTop: 6, fontSize: 18, fontWeight: 950, color: "#33475E", letterSpacing: "-.25px" }}>Today is for resting, on purpose.</div>
      <p style={{ margin: "8px auto 0", maxWidth: 420, fontSize: 13.5, lineHeight: 1.55, color: "#5E7186", fontStyle: "italic" }}>&ldquo;{affirmation}&rdquo;</p>
      {suggestions.length > 0 && (
        <div style={{ marginTop: 13, textAlign: "left" }}>
          <div style={{ fontSize: 11, letterSpacing: ".1em", fontWeight: 900, color: "#7B93AA" }}>IF YOU WANT A LITTLE SOMETHING</div>
          <div style={{ display: "grid", gap: 7, marginTop: 8 }}>
            {suggestions.map((tool) => (
              <button
                key={tool.id || tool.name}
                type="button"
                onClick={openCare}
                aria-label={`Open ${tool.name} — a few quiet minutes, no score`}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", minHeight: 48, padding: "9px 12px", borderRadius: 14, border: "1px solid #D9E8F5", background: "rgba(255,255,255,.85)", cursor: "pointer" }}
              >
                <span aria-hidden="true" style={{ fontSize: 22 }}>{tool.icon || "💗"}</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ display: "block", fontSize: 13.5, fontWeight: 850, color: "#33475E" }}>{tool.name}</span>
                  <span style={{ display: "block", fontSize: 11.5, color: "#7B93AA" }}>A few quiet minutes · no score</span>
                </span>
                <span aria-hidden="true" style={{ color: "#9AB4CC", fontSize: 20 }}>›</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div style={{ marginTop: 13, fontSize: 12, color: "#7B93AA", fontWeight: 700 }}>
        {Number(careDaysTotal) > 0
          ? `💗 ${careDaysTotal} ${Number(careDaysTotal) === 1 ? "day" : "days"} of care so far — this one counts too.`
          : "💗 Rest days count as care days here."}
      </div>
    </section>
  );
}
