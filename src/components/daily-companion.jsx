import { DailyCompanion as DailyCompanionCore } from "./daily-companion-core.jsx";

export function DailyCompanion(props) {
  const [open, setOpen] = React.useState(false);
  if (!props.open) return null;
  return (
    <section style={{ marginTop: 16, marginBottom: 18, borderRadius: 17, background: "rgba(255,255,255,.78)", border: "1px solid #E6D4F2", overflow: "hidden", boxShadow: "0 6px 20px rgba(118,85,138,.06)" }}>
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center", padding: "13px 14px", border: 0, background: "transparent", textAlign: "left", cursor: "pointer" }}>
        <span>
          <span style={{ display: "block", fontSize: 10.5, letterSpacing: ".13em", fontWeight: 900, color: "#A65DC1" }}>✨ PLUSHCOMPANION</span>
          <span style={{ display: "block", marginTop: 3, fontSize: 13.5, fontWeight: 900, color: "#5B4B6B" }}>Gentle Day, quick add, evening reset & support</span>
          <span style={{ display: "block", marginTop: 2, fontSize: 11, lineHeight: 1.4, color: "#8C6B9E" }}>Optional tools stay tucked away until you want them.</span>
        </span>
        <span aria-hidden="true" style={{ color: "#A58AAF", fontSize: 21, fontWeight: 900 }}>{open ? "▾" : "›"}</span>
      </button>
      {open && <div style={{ padding: "0 10px 10px" }}><DailyCompanionCore {...props} /></div>}
    </section>
  );
}
