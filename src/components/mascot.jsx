import { ThemeScene } from "./theme-world.jsx";
// The mascot and the small components that render it directly — module
// split phase 6 (see docs/module-split-plan.md).
const { MASCOT_OUTFITS } = window.PlushLifeContent;
const { mascotGrowthStageForDays } = window.PlushLifeHelpers;

const SPARKLE_LEFT = [6, 88, 12, 82];
const SPARKLE_TOP = [4, 8, 78, 74];

// Extracted constant styles to avoid re-creating objects on every render.
const SVG_STYLE = { width: "100%", height: "100%", display: "block" };
const LOADING_SCREEN_STYLE = {
  minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center",
  justifyContent: "center", gap: 14, background: "#FFF8FC",
  backgroundImage: "radial-gradient(circle at 6% 8%, #FCE1F3 0%, transparent 38%), radial-gradient(circle at 96% 4%, #D8F3EC 0%, transparent 38%)",
  fontFamily: "'Nunito','Segoe UI',sans-serif",
};
const LOADING_MASCOT_STYLE = { animation: "appLoadingBob 1.6s ease-in-out infinite" };
const LOADING_LABEL_STYLE = { fontSize: 13.5, fontWeight: 800, color: "#8574A0", letterSpacing: "0.02em", animation: "appLoadingFade 1.6s ease-in-out infinite" };

export const PlushMascot = React.memo(function PlushMascot({ outfit = MASCOT_OUTFITS[0], size = 150, celebrating = false, mood = "neutral", activityDays = 0, theme, variant = "bear" }) {
  const growth = mascotGrowthStageForDays(activityDays);
  return (
    <div className={celebrating ? "plush-mascot mascot-celebrating" : "plush-mascot"} style={{ width: size, aspectRatio: "211 / 100", position: "relative", borderRadius: "50%", boxShadow: growth.glow }}>
      {growth.sparkles.map((sparkle, index) => (
        <span key={index} aria-hidden="true" style={{ position: "absolute", fontSize: Math.round(size * 0.16), left: `${SPARKLE_LEFT[index % 4]}%`, top: `${SPARKLE_TOP[index % 4]}%`, pointerEvents: "none" }}>{sparkle}</span>
      ))}
      <ThemeScene world={theme} outfit={outfit} />
    </div>
  );
});

export function NurseryNook({ outfit, mood, activityDays, onOpenCloset }) {
  const hasStarLampAndBasket = activityDays >= 10;
  return (
    <button type="button" className="nursery-nook" onClick={onOpenCloset} aria-label={`Open your mascot closet${hasStarLampAndBasket ? "; nursery includes a soft star lamp and toy basket" : ""}`}>
      <span className="nursery-nook-label">MY LITTLE NURSERY</span>
      <span className="nursery-cloud nursery-cloud-left" aria-hidden="true">☁️</span>
      <span className="nursery-cloud nursery-cloud-right" aria-hidden="true">☁️</span>
      <span className="nursery-mobile" aria-hidden="true">
        <span className="nursery-mobile-bar">⌒</span>
        <span>⭐</span><span>🌙</span><span>💜</span>
      </span>
      {hasStarLampAndBasket ? <>
        <span className="nursery-toy nursery-toy-left nursery-star-lamp" aria-hidden="true"><span>⭐</span><span>│</span></span>
        <span className="nursery-toy nursery-toy-right nursery-toy-basket" aria-hidden="true"><span>🧸</span><span>🧺</span></span>
      </> : <>
        <span className="nursery-toy nursery-toy-left" aria-hidden="true">🧸</span>
        <span className="nursery-toy nursery-toy-right" aria-hidden="true">🍼</span>
      </>}
      <span className="nursery-mascot"><PlushMascot outfit={outfit} size={106} mood={mood} activityDays={activityDays} /></span>
      <span className="nursery-nook-caption">Tap to visit your closet</span>
    </button>
  );
}

export function AppLoadingScreen() {
  return (
    <div style={LOADING_SCREEN_STYLE} role="status" aria-label="Loading PlushLife">
      <style>{`
        @keyframes appLoadingBob { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-8px) } }
        @keyframes appLoadingFade { 0%,100% { opacity:0.55 } 50% { opacity:1 } }
        @media (prefers-reduced-motion: reduce) {
          .app-loading-mascot, .app-loading-label { animation: none !important; }
        }
      `}</style>
      <div className="app-loading-mascot" style={LOADING_MASCOT_STYLE} aria-hidden="true">
        <PlushMascot size={84} />
      </div>
      <div className="app-loading-label" style={LOADING_LABEL_STYLE}>Loading your PlushLife…</div>
    </div>
  );
}
