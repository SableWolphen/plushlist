import { PLUSH_GOLD_BILLING_ENABLED, PLUSH_GOLD_FEATURES, goldPreviewSummary } from "../plush-gold.js";

const groupStyle = {
  padding: "12px 13px",
  borderRadius: 14,
  border: "1px solid #E6D4F2",
  background: "rgba(255,255,255,.86)",
  marginBottom: 10,
};

export function PlushGoldPreview() {
  const summary = goldPreviewSummary();
  const available = summary.features.filter((feature) => feature.status === "available");
  const reserved = summary.features.filter((feature) => feature.status === "reserved");

  return (
    <div>
      <div style={{ padding: "13px 14px", borderRadius: 16, background: "linear-gradient(135deg,#FFF8DE,#FBF3FE)", border: "1px solid #E7D29A", marginBottom: 12 }}>
        <div style={{ fontSize: 11, letterSpacing: ".12em", fontWeight: 900, color: "#9A6B14" }}>✨ PLUSH GOLD PREVIEW</div>
        <div style={{ marginTop: 5, fontSize: 16, fontWeight: 900, color: "#5B4B6B" }}>Everything is included free for now.</div>
        <div style={{ marginTop: 5, fontSize: 12, lineHeight: 1.5, color: "#7B6A83" }}>
          Plush Gold is being structured now so deeper intelligence can become an optional paid tier later. During preview, every Gold feature stays unlocked and no purchase is required.
        </div>
        <div style={{ marginTop: 8, display: "inline-flex", padding: "4px 8px", borderRadius: 999, background: "#EEF8F4", color: "#38816F", fontSize: 10.5, fontWeight: 900 }}>
          {PLUSH_GOLD_BILLING_ENABLED ? "Billing active" : "Billing off · free preview"}
        </div>
      </div>

      <div style={groupStyle}>
        <div style={{ fontSize: 11, fontWeight: 900, color: "#745D81", marginBottom: 7 }}>INCLUDED IN THE PREVIEW</div>
        <div style={{ display: "grid", gap: 7 }}>
          {available.map((feature) => (
            <div key={feature.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, color: "#5B4B6B" }}>
              <span aria-hidden="true" style={{ color: "#38816F", fontWeight: 900 }}>✓</span>
              <span>{feature.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={groupStyle}>
        <div style={{ fontSize: 11, fontWeight: 900, color: "#745D81", marginBottom: 5 }}>GOLD-READY, NOT YET RELEASED</div>
        <div style={{ fontSize: 11.5, lineHeight: 1.45, color: "#8A7895", marginBottom: 7 }}>These are reserved in the Gold access model so they can be added later without redesigning the tier system.</div>
        <div style={{ display: "grid", gap: 7 }}>
          {reserved.map((feature) => (
            <div key={feature.id} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, color: "#6B5A7D" }}>
              <span aria-hidden="true">○</span>
              <span>{feature.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 11.5, lineHeight: 1.5, color: "#8A7895" }}>
        Core PlushLife stays separate from Gold: basic habits/tasks, Focus Habit, check-ins, Today, accessibility, Baby Mode, Low Screen Time, basic reminders, and core support are not part of this premium feature registry.
      </div>
    </div>
  );
}

export { PLUSH_GOLD_FEATURES };
