const RATING_PROMPT_KEY = "plushlife:rating-prompt:v1";
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.PlushLife";

function readRatingPromptState() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RATING_PROMPT_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_error) {
    return {};
  }
}

export function RatingMoment({ completedCount = 0 }) {
  const [state, setState] = React.useState(readRatingPromptState);
  const now = Date.now();
  const dismissedUntil = Number(state.dismissedUntil || 0);
  const eligible = completedCount >= 3 && !state.rated && (!dismissedUntil || dismissedUntil <= now);
  if (!eligible) return null;

  const save = (next) => {
    setState(next);
    try { window.localStorage.setItem(RATING_PROMPT_KEY, JSON.stringify(next)); } catch (_error) {}
  };
  const rate = () => {
    save({ rated: true, ratedAt: new Date().toISOString() });
    try { window.open(PLAY_STORE_URL, "_blank", "noopener,noreferrer"); }
    catch (_error) { window.location.href = PLAY_STORE_URL; }
  };
  const later = () => save({ ...state, dismissedUntil: now + (30 * 24 * 60 * 60 * 1000) });

  return (
    <div role="region" aria-label="Rate PlushLife" style={{ marginTop: 10, padding: "10px 11px", borderRadius: 12, border: "1px solid #D9E8E2", background: "linear-gradient(145deg,#F5FCF9,#FFF9FD)" }}>
      <div style={{ fontSize: 11.5, fontWeight: 900, color: "#4D8174" }}>💜 Nice work today</div>
      <div style={{ marginTop: 3, fontSize: 10.8, lineHeight: 1.4, color: "#71857F" }}>If PlushLife has been useful, a quick Play Store rating helps other people find it too.</div>
      <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
        <button type="button" onClick={rate} style={{ minHeight: 44, padding: "8px 11px", borderRadius: 10, border: 0, background: "#4D8174", color: "white", fontWeight: 900, cursor: "pointer" }}>★ Rate PlushLife</button>
        <button type="button" onClick={later} style={{ minHeight: 44, padding: "8px 11px", borderRadius: 10, border: "1px solid #D7E8E3", background: "white", color: "#71857F", fontWeight: 800, cursor: "pointer" }}>Maybe later</button>
      </div>
    </div>
  );
}
