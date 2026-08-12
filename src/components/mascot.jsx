// The mascot and the small components that render it directly — module
// split phase 6 (see docs/module-split-plan.md).
const { MASCOT_OUTFITS } = window.PlushLifeContent;
const { mascotGrowthStageForDays } = window.PlushLifeHelpers;

const ACCESSORY_POSITIONS = {
  bow: { left: "24%", top: "9%" },
  glasses: { left: "50%", top: "38%", transform: "translateX(-50%)" },
  cape: { left: "80%", top: "54%" },
  party: { left: "68%", top: "1%" },
};
const DEFAULT_ACCESSORY_POSITION = { left: "50%", top: "1%", transform: "translateX(-50%)" };
const SPARKLE_LEFT = [6, 88, 12, 82];
const SPARKLE_TOP = [4, 8, 78, 74];

export const PlushMascot = React.memo(function PlushMascot({ outfit = MASCOT_OUTFITS[0], size = 150, celebrating = false, mood = "neutral", activityDays = 0 }) {
  const accessorySize = Math.round(size * 0.23);
  const accessoryPos = ACCESSORY_POSITIONS[outfit.id] || DEFAULT_ACCESSORY_POSITION;
  const growth = mascotGrowthStageForDays(activityDays);
  return (
    <div className={celebrating ? "plush-mascot mascot-celebrating" : "plush-mascot"} style={{ width: size, height: size, position: "relative", borderRadius: "50%", boxShadow: growth.glow }}>
      {growth.sparkles.map((sparkle, index) => (
        <span key={index} aria-hidden="true" style={{ position: "absolute", fontSize: Math.round(size * 0.16), left: `${SPARKLE_LEFT[index % 4]}%`, top: `${SPARKLE_TOP[index % 4]}%`, pointerEvents: "none" }}>{sparkle}</span>
      ))}
      <svg viewBox="0 0 240 220" role="img" aria-label={`PlushLife mascot wearing ${outfit.name}, looking ${mood}`} style={{ width: "100%", height: "100%", display: "block" }}>
        <path d="M184 72 C222 43 233 63 222 91 C214 112 202 127 187 139" fill="none" stroke="#FFA510" strokeWidth="17" strokeLinecap="round" />
        <circle cx="120" cy="117" r="80" fill="#FFEAF7" stroke="#B64CCB" strokeWidth="7" />
        <circle cx="61" cy="60" r="25" fill="#FFF4FB" stroke="#B64CCB" strokeWidth="7" />
        <circle cx="179" cy="60" r="25" fill="#FFF4FB" stroke="#B64CCB" strokeWidth="7" />
        <ellipse cx="77" cy="190" rx="30" ry="20" fill="#FFF4FB" stroke="#B64CCB" strokeWidth="7" />
        <ellipse cx="163" cy="190" rx="30" ry="20" fill="#FFF4FB" stroke="#B64CCB" strokeWidth="7" />
        <path d="M91 43 L101 10 L116 45 Z M124 41 L139 16 L151 50 Z" fill="#12C8AA" stroke="#12A88F" strokeWidth="3" />
        <circle cx="120" cy="116" r="61" fill="#FFFFFF" stroke="#B64CCB" strokeWidth="7" />
        {mood === "tired" ? (
          <>
            <path d="M88 106 Q98 113 108 106" stroke="#50405F" strokeWidth="6" fill="none" strokeLinecap="round" />
            <path d="M132 106 Q142 113 152 106" stroke="#50405F" strokeWidth="6" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="98" cy="105" r="10" fill="#50405F" />
            <circle cx="142" cy="105" r="10" fill="#50405F" />
            <circle cx="95" cy="101" r="3" fill="#FFFFFF" />
            <circle cx="139" cy="101" r="3" fill="#FFFFFF" />
          </>
        )}
        <circle cx="82" cy="132" r="10" fill="#F5A8DC" />
        <circle cx="158" cy="132" r="10" fill="#F5A8DC" />
        {mood === "tired" ? (
          <path d="M107 142 Q120 146 133 142" fill="none" stroke="#50405F" strokeWidth="6" strokeLinecap="round" />
        ) : mood === "excited" ? (
          <path d="M97 133 Q120 163 143 133" fill="none" stroke="#50405F" strokeWidth="6" strokeLinecap="round" />
        ) : (
          <path d="M104 137 Q120 153 136 137" fill="none" stroke="#50405F" strokeWidth="6" strokeLinecap="round" />
        )}
        {mood === "tired" && <text x="168" y="50" fontSize="26" aria-hidden="true">💤</text>}
        {mood === "excited" && <>
          <text x="26" y="48" fontSize="22" aria-hidden="true">✨</text>
          <text x="196" y="142" fontSize="22" aria-hidden="true">✨</text>
        </>}
      </svg>
      {outfit.accessory && (
        <span className="mascot-accessory" aria-hidden="true" style={{ position: "absolute", zIndex: 2, fontSize: accessorySize, lineHeight: 1, filter: "drop-shadow(0 3px 3px rgba(70,38,88,.22))", ...accessoryPos }}>{outfit.accessory}</span>
      )}
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
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14, background: "#FFF8FC", backgroundImage: "radial-gradient(circle at 6% 8%, #FCE1F3 0%, transparent 38%), radial-gradient(circle at 96% 4%, #D8F3EC 0%, transparent 38%)", fontFamily: "'Nunito','Segoe UI',sans-serif" }}>
      <style>{`
        @keyframes appLoadingBob { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-8px) } }
        @keyframes appLoadingFade { 0%,100% { opacity:0.55 } 50% { opacity:1 } }
        @media (prefers-reduced-motion: reduce) {
          .app-loading-mascot, .app-loading-label { animation: none !important; }
        }
      `}</style>
      <div className="app-loading-mascot" style={{ animation: "appLoadingBob 1.6s ease-in-out infinite" }}>
        <PlushMascot size={84} />
      </div>
      <div className="app-loading-label" style={{ fontSize: 13.5, fontWeight: 800, color: "#8574A0", letterSpacing: "0.02em", animation: "appLoadingFade 1.6s ease-in-out infinite" }}>Loading your PlushLife…</div>
    </div>
  );
}
