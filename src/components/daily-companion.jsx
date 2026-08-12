import { useCompanionCloudSync } from "./companion-cloud-sync.jsx";

const LazyDailyCompanionCore = React.lazy(() => import("./daily-companion-core.jsx").then((module) => ({ default: module.DailyCompanion })));

export function DailyCompanion(props) {
  const [open, setOpen] = React.useState(false);
  const { ready, status } = useCompanionCloudSync(!!props.open);
  if (!props.open) return null;
  const syncLabel = status === "synced" ? "Account protected" : status === "offline" ? "Saved here · sync later" : "Saved on this device";
  return (
    <section style={{ marginTop: 16, marginBottom: 18, borderRadius: 17, background: "rgba(255,255,255,.78)", border: "1px solid #E6D4F2", overflow: "hidden", boxShadow: "0 6px 20px rgba(118,85,138,.06)" }}>
      <button type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} style={{ width: "100%", display: "grid", gridTemplateColumns: "1fr auto", gap: 10, alignItems: "center", padding: "13px 14px", border: 0, background: "transparent", textAlign: "left", cursor: "pointer" }}>
        <span>
          <span style={{ display: "block", fontSize: 10.5, letterSpacing: ".13em", fontWeight: 900, color: "#A65DC1" }}>✨ PLUSHCOMPANION</span>
          <span style={{ display: "block", marginTop: 3, fontSize: 13.5, fontWeight: 900, color: "#5B4B6B" }}>Gentle Day, quick add, evening reset & support</span>
          <span style={{ display: "block", marginTop: 2, fontSize: 11, lineHeight: 1.4, color: "#8C6B9E" }}>Optional tools stay tucked away until you want them. · {syncLabel}</span>
        </span>
        <span aria-hidden="true" style={{ color: "#A58AAF", fontSize: 21, fontWeight: 900 }}>{open ? "▾" : "›"}</span>
      </button>
      {open && <div style={{ padding: "0 10px 10px" }}>
        {!ready ? <div role="status" style={{ padding: "12px 10px", color: "#8C6B9E", fontSize: 11.5 }}>Restoring your companion tools…</div> : <React.Suspense fallback={<div role="status" style={{ padding: "12px 10px", color: "#8C6B9E", fontSize: 11.5 }}>Opening companion tools…</div>}><LazyDailyCompanionCore {...props} /></React.Suspense>}
      </div>}
    </section>
  );
}
