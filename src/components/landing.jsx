// The signed-out marketing/landing page — module split phase 6 (see
// docs/module-split-plan.md).
const { useState } = React;

export function LandingPage({ email, setEmail, otpCode, setOtpCode, showSignIn, setShowSignIn, sendSignInLink, verifySignInCode, signInMessage, codeCooldown, password, setPassword, showPasswordField, setShowPasswordField, signInWithPassword }) {
  const colors = { bg: "#FFF8FC", plum: "#4A3A5C", soft: "#8574A0", orchid: "#B95FCE", mint: "#3FC7A6", amber: "#F2A93B", line: "#F0D9EE" };
  const demoTasks = [
    ["💧", "Drink some water"],
    ["🦷", "Brush my teeth"],
    ["🌤️", "Stretch for five minutes"],
    ["🎒", "Prepare one thing for tomorrow"],
  ];
  const [demoDone, setDemoDone] = useState(() => demoTasks.map(() => false));
  const [demoCelebrating, setDemoCelebrating] = useState(false);
  const demoCompleted = demoDone.filter(Boolean).length;
  const demoPercent = Math.round((demoCompleted / demoTasks.length) * 100);
  const toggleDemoTask = (index) => {
    setDemoDone((current) => {
      const next = current.map((done, taskIndex) => taskIndex === index ? !done : done);
      setDemoCelebrating(next.every(Boolean));
      return next;
    });
  };
  const resetDemo = () => {
    setDemoDone(demoTasks.map(() => false));
    setDemoCelebrating(false);
  };
  return (
    <div style={{ minHeight: "100vh", background: colors.bg, backgroundImage: "radial-gradient(circle at 6% 8%, #FCE1F3 0%, transparent 38%), radial-gradient(circle at 96% 4%, #D8F3EC 0%, transparent 38%), radial-gradient(circle at 90% 92%, #FDF0D6 0%, transparent 42%)", color: colors.plum, fontFamily: "'Nunito','Segoe UI',sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;700;800&family=Nunito:wght@400;600;700;800&family=IBM+Plex+Mono:wght@500&display=swap');
        @keyframes plushBob { 0%,100% { transform:translateY(0) rotate(-1.5deg) } 50% { transform:translateY(-10px) rotate(1.5deg) } }
        @keyframes checkPop { 0% { transform:scale(1) } 40% { transform:scale(1.35) rotate(-8deg) } 70% { transform:scale(0.92) rotate(4deg) } 100% { transform:scale(1) rotate(0) } }
        @keyframes demoPop { 0% { transform:scale(.88);opacity:0 } 65% { transform:scale(1.05);opacity:1 } 100% { transform:scale(1);opacity:1 } }
        @keyframes demoSparkle { 0%,100% { transform:rotate(-8deg) scale(1) } 50% { transform:rotate(8deg) scale(1.18) } }
        .plush-feature-grid { display:grid;grid-template-columns:repeat(2,1fr);gap:22px }
        .landing-nav-links { display:flex;align-items:center;gap:18px }
        .landing-nav-link { color:#6E5A82;text-decoration:none;font-size:13px;font-weight:800 }
        .landing-nav-link:hover { color:#B95FCE }
        .landing-benefit-strip { display:grid;grid-template-columns:repeat(4,1fr);gap:10px;max-width:900px;margin:18px auto 0;padding:0 20px }
        .landing-benefit-pill { display:flex;align-items:center;justify-content:center;gap:7px;min-height:42px;padding:8px 12px;border:1px solid #F0D9EE;border-radius:999px;background:rgba(255,255,255,.76);color:#6E5A82;font-size:12px;font-weight:900;box-shadow:0 10px 28px -24px rgba(90,50,110,.45) }
        .landing-feature-card { position:relative;overflow:hidden;transition:transform .2s ease,box-shadow .2s ease,border-color .2s ease }
        .landing-feature-card:hover { transform:translateY(-3px);border-color:#DDB3E5 !important;box-shadow:0 20px 38px -22px rgba(90,50,110,.34) !important }
        .landing-feature-tag { display:inline-flex;align-items:center;min-height:27px;padding:3px 10px;border-radius:999px;background:#F9E7F7;color:#9A4EAD;font-size:10.5px;font-weight:900;letter-spacing:.08em;text-transform:uppercase }
        .landing-how-grid { display:grid;grid-template-columns:repeat(3,1fr);gap:16px }
        .landing-difference-grid { display:grid;grid-template-columns:1fr 1fr;gap:1px;overflow:hidden;border:1px solid #EED8ED;border-radius:22px;background:#EED8ED;box-shadow:0 20px 45px -28px rgba(90,50,110,.36) }
        .landing-difference-cell { min-height:86px;padding:18px 20px;background:rgba(255,255,255,.92) }
        .landing-difference-cell.plush { background:linear-gradient(135deg,#FFF7FD,#F1FCF8) }
        .landing-device-stage { overflow:hidden;border:1px solid #EED8ED;border-radius:32px;background:#FBF6FA;box-shadow:0 30px 70px -38px rgba(77,47,94,.42) }
        .landing-device-image { display:block;width:100%;height:auto;aspect-ratio:1.425/1;object-fit:cover }
        .landing-device-stage > div { display:none }
        .landing-demo-task:hover { border-color:#D9A6E3 !important; transform:translateY(-1px) }
        .landing-demo-task:focus-visible { outline:3px solid #E7B8F0;outline-offset:2px }
        @media(max-width:800px){.plush-feature-grid,.landing-how-grid{grid-template-columns:1fr}.landing-benefit-strip{grid-template-columns:repeat(2,1fr)}.landing-device-stage{border-radius:24px}}
        @media(max-width:560px){.landing-nav-links{display:none}.landing-benefit-strip{grid-template-columns:1fr 1fr;gap:7px;padding:0 14px}.landing-benefit-pill{border-radius:15px;font-size:11px;padding:7px}.landing-signin-row{flex-direction:column}.landing-signin-row button{width:100%}.landing-difference-cell{min-height:96px;padding:15px 13px}}
      `}</style>
      <nav style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "26px 28px", maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: "'Baloo 2',sans-serif", fontSize: 22, fontWeight: 800 }}>
          <span style={{ width: 34, height: 34, borderRadius: "50%", background: colors.orchid, boxShadow: "inset 0 0 0 8px #F2D8F5" }} /> PlushLife
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div className="landing-nav-links">
            <a className="landing-nav-link" href="#landing-difference">Why it’s different</a>
            <a className="landing-nav-link" href="#landing-features">Features</a>
          </div>
          <button onClick={() => setShowSignIn(true)} style={{ background: colors.plum, color: "white", border: 0, padding: "10px 20px", borderRadius: 999, fontWeight: 800, cursor: "pointer" }}>Start free</button>
        </div>
      </nav>

      <section style={{ padding: "40px 28px 20px", textAlign: "center" }}>
        <span style={{ display: "inline-block", fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", color: colors.orchid, background: "#F9E4F7", padding: "6px 16px", borderRadius: 999, marginBottom: 22 }}>ROUTINES · SELF-CARE · SUPPORT</span>
        <h1 style={{ fontFamily: "'Baloo 2',sans-serif", fontSize: "clamp(38px,6vw,64px)", fontWeight: 800, lineHeight: 1.05, margin: "0 0 18px" }}>Care that fits<br/><span style={{ color: colors.orchid }}>the day you’re having.</span></h1>
        <p style={{ fontSize: 18, color: colors.soft, maxWidth: 650, margin: "0 auto 30px", lineHeight: 1.6 }}>PlushLife brings your schedule, habits, self-care, check-ins, journal, and trusted support into one private daily companion. Unlike a rigid checklist, it adapts to the energy you actually have.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <button onClick={() => setShowSignIn(true)} style={{ background: colors.orchid, color: "white", border: 0, padding: "15px 30px", borderRadius: 999, fontWeight: 800, fontSize: 16, cursor: "pointer", boxShadow: "0 12px 24px -10px rgba(185,95,206,.6)" }}>Start your list</button>
          <button onClick={() => document.getElementById("landing-features")?.scrollIntoView({ behavior: "smooth" })} style={{ background: "transparent", color: colors.plum, border: `2px solid ${colors.line}`, padding: "13px 26px", borderRadius: 999, fontWeight: 800, fontSize: 16, cursor: "pointer" }}>See how it works</button>
        </div>

        {showSignIn && (
          <div style={{ maxWidth: 480, margin: "22px auto 0", padding: 16, borderRadius: 18, background: "rgba(255,255,255,.86)", border: `1px solid ${colors.line}`, boxShadow: "0 18px 38px -24px rgba(90,50,110,.35)" }}>
            <div style={{ fontFamily: "'Baloo 2',sans-serif", fontSize: 20, fontWeight: 800 }}>Create or open your private tracker</div>
            <div style={{ marginTop: 3, fontSize: 13, color: colors.soft }}>We’ll email you a secure one-time sign-in code.</div>
            <div className="landing-signin-row" style={{ display: "flex", gap: 8, marginTop: 11 }}>
              <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" aria-label="Email address" style={{ flex: 1, minWidth: 0, padding: "11px 12px", borderRadius: 11, border: `1px solid ${colors.line}`, fontSize: 14 }} />
              <button onClick={sendSignInLink} disabled={codeCooldown > 0} style={{ padding: "11px 14px", borderRadius: 11, border: 0, background: colors.orchid, color: "white", fontWeight: 800, cursor: codeCooldown > 0 ? "not-allowed" : "pointer", opacity: codeCooldown > 0 ? 0.55 : 1 }}>{codeCooldown > 0 ? `Wait ${codeCooldown}s` : "Send code"}</button>
            </div>
            <div className="landing-signin-row" style={{ display: "flex", gap: 8, marginTop: 9 }}>
              <input inputMode="numeric" autoComplete="one-time-code" value={otpCode} onChange={(event) => setOtpCode(event.target.value.replace(/\D/g, "").slice(0, 8))} placeholder="Email code" aria-label="Email sign-in code" style={{ flex: 1, minWidth: 0, padding: "11px 12px", borderRadius: 11, border: `1px solid ${colors.line}`, fontSize: 16, letterSpacing: "0.16em" }} />
              <button onClick={verifySignInCode} style={{ padding: "11px 14px", borderRadius: 11, border: `1px solid ${colors.orchid}`, background: "white", color: colors.orchid, fontWeight: 800, cursor: "pointer" }}>Sign in</button>
            </div>
            {signInMessage && <div style={{ marginTop: 9, fontSize: 12.5, color: colors.soft }}>{signInMessage}</div>}
            {codeCooldown > 0 && <div style={{ marginTop: 5, fontSize: 11.5, color: colors.soft }}>One code is active. Check your inbox before requesting another.</div>}
            <a href="#" onClick={(event) => { event.preventDefault(); setShowPasswordField((shown) => !shown); }} style={{ display: "block", marginTop: 10, fontSize: 12.5, color: colors.soft }}>{showPasswordField ? "Use the emailed code instead" : "Have a password instead?"}</a>
            {showPasswordField && (
              <div style={{ display: "flex", gap: 8, marginTop: 9 }}>
                <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" aria-label="Password" style={{ flex: 1, minWidth: 0, padding: "11px 12px", borderRadius: 11, border: `1px solid ${colors.line}`, fontSize: 14 }} />
                <button onClick={signInWithPassword} style={{ padding: "11px 14px", borderRadius: 11, border: `1px solid ${colors.orchid}`, background: "white", color: colors.orchid, fontWeight: 800, cursor: "pointer" }}>Sign in</button>
              </div>
            )}
          </div>
        )}

        <svg aria-hidden="true" viewBox="0 0 200 200" width="200" height="200" style={{ marginTop: 10, animation: "plushBob 3.2s ease-in-out infinite" }}>
          <path d="M155 130 Q185 120 180 90 Q178 75 160 80" fill="none" stroke={colors.amber} strokeWidth="14" strokeLinecap="round"/>
          <ellipse cx="100" cy="120" rx="62" ry="54" fill="#FCEFFB" stroke={colors.orchid} strokeWidth="3"/>
          <path d="M60 78 L68 58 L76 78 M86 72 L94 50 L102 72 M112 78 L120 58 L128 78" fill={colors.mint} stroke="#2FA88C" strokeWidth="2"/>
          <path d="M55 118 q10 8 0 16 M75 128 q10 8 0 16 M125 128 q-10 8 0 16 M145 118 q-10 8 0 16" stroke={colors.amber} strokeWidth="5" fill="none" strokeLinecap="round"/>
          <circle cx="65" cy="72" r="13" fill="#FCEFFB" stroke={colors.orchid} strokeWidth="3"/><circle cx="135" cy="72" r="13" fill="#FCEFFB" stroke={colors.orchid} strokeWidth="3"/>
          <circle cx="100" cy="112" r="40" fill="white" stroke={colors.orchid} strokeWidth="3"/>
          <circle cx="82" cy="108" r="9" fill={colors.plum}/><circle cx="118" cy="108" r="9" fill={colors.plum}/>
          <circle cx="82" cy="108" r="3.4" fill="white"/><circle cx="118" cy="108" r="3.4" fill="white"/>
          <circle cx="70" cy="122" r="7" fill="#F9C9E9"/><circle cx="130" cy="122" r="7" fill="#F9C9E9"/>
          <path d="M90 128 Q100 136 110 128" stroke={colors.plum} strokeWidth="3" fill="none" strokeLinecap="round"/>
          <ellipse cx="75" cy="168" rx="16" ry="10" fill="#FCEFFB" stroke={colors.orchid} strokeWidth="3"/><ellipse cx="125" cy="168" rx="16" ry="10" fill="#FCEFFB" stroke={colors.orchid} strokeWidth="3"/>
        </svg>
      </section>

      <div aria-label="PlushLife benefits" className="landing-benefit-strip">
        <div className="landing-benefit-pill"><span aria-hidden="true">🌤️</span> Adapts to your energy</div>
        <div className="landing-benefit-pill"><span aria-hidden="true">🛟</span> Help when overwhelmed</div>
        <div className="landing-benefit-pill"><span aria-hidden="true">🔒</span> Private by design</div>
        <div className="landing-benefit-pill"><span aria-hidden="true">💜</span> No guilt or streak loss</div>
      </div>

      <section id="landing-difference" style={{ padding: "68px 20px 34px", maxWidth: 920, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ color: colors.orchid, fontSize: 11, fontWeight: 900, letterSpacing: ".13em" }}>WHY PLUSHLIFE FEELS DIFFERENT</div>
          <h2 style={{ fontFamily: "'Baloo 2',sans-serif", fontSize: "clamp(28px,4vw,38px)", margin: "7px 0 9px" }}>Built for real capacity—not perfect streaks.</h2>
          <p style={{ color: colors.soft, fontSize: 15.5, maxWidth: 640, margin: "0 auto", lineHeight: 1.6 }}>Many trackers measure whether you followed the plan. PlushLife also helps you make a plan that still fits when life changes.</p>
        </div>
        <div className="landing-difference-grid" role="table" aria-label="How PlushLife differs from many routine trackers">
          <div className="landing-difference-cell" role="columnheader"><div style={{ color: colors.soft, fontSize: 11, fontWeight: 900, letterSpacing: ".1em" }}>MANY ROUTINE TRACKERS</div><div style={{ marginTop: 6, fontWeight: 900 }}>The plan stays the same every day</div></div>
          <div className="landing-difference-cell plush" role="columnheader"><div style={{ color: colors.orchid, fontSize: 11, fontWeight: 900, letterSpacing: ".1em" }}>PLUSHLIFE</div><div style={{ marginTop: 6, fontWeight: 900 }}>Full, Soft, Tiny, and Recovery Days</div></div>
          {[
            ["A missed day can feel like starting over","Returning counts, and earned progress stays yours"],
            ["Planning and coping tools live in separate places","Schedule, check-ins, Focus, and PlushRescue work together"],
            ["Support can mean sharing too much—or going alone","A Guardian sees only what you choose to share"],
          ].flatMap(([usual,plush], index) => [
            <div className="landing-difference-cell" role="cell" key={`usual-${index}`}><div style={{ color: colors.soft, fontSize: 13.5, lineHeight: 1.5 }}>{usual}</div></div>,
            <div className="landing-difference-cell plush" role="cell" key={`plush-${index}`}><div style={{ color: colors.plum, fontSize: 13.5, fontWeight: 800, lineHeight: 1.5 }}>✓ {plush}</div></div>,
          ])}
        </div>
      </section>

      <section aria-labelledby="landing-devices-title" style={{ padding: "46px 20px 54px", maxWidth: 920, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ color: colors.orchid, fontSize: 11, fontWeight: 900, letterSpacing: ".13em" }}>PLUSHLIFE THROUGHOUT YOUR DAY</div>
          <h2 id="landing-devices-title" style={{ fontFamily: "'Baloo 2',sans-serif", fontSize: "clamp(28px,4vw,38px)", margin: "7px 0 9px" }}>The full picture on your phone. Gentle help on your wrist.</h2>
          <p style={{ color: colors.soft, fontSize: 15.5, maxWidth: 650, margin: "0 auto", lineHeight: 1.6 }}>Plan and reflect in the PlushLife app, then use the Amazfit companion for quick check-ins, Tiny Steps, Focus, and PlushRescue when reaching for your phone feels like too much.</p>
        </div>
        <div className="landing-device-stage">
          <img className="landing-device-image" src="assets/plushlife-devices.webp" width="1460" height="1024" loading="lazy" decoding="async" alt="PlushLife daily planning screen shown on a plum smartphone beside the quick check-in companion on a lavender smartwatch" />
          <div>
            <div className="landing-phone" aria-label="Example PlushLife phone screen">
              <div className="landing-phone-screen">
                <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: ".14em", color: colors.orchid }}>MY PLUSHLIFE · SUNDAY</div>
                <div style={{ marginTop: 4, fontFamily: "'Baloo 2',sans-serif", fontSize: 20, fontWeight: 900 }}>A gentle little day 💜</div>
                <div style={{ marginTop: 11, padding: "10px 11px", borderRadius: 13, background: "rgba(255,255,255,.88)", border: "1px solid #E8D2E8", fontSize: 11.5, fontWeight: 900 }}>🎯 Check-in · Soft Day</div>
                <div style={{ display: "flex", gap: 7, marginTop: 10 }}>
                  <div style={{ flex: 1, padding: "10px", borderRadius: 13, background: "rgba(255,255,255,.82)", border: "1px solid #E8D2E8" }}><div style={{ fontSize: 8.5, fontWeight: 900, color: colors.orchid }}>PLUSHJOURNAL</div><div style={{ marginTop: 5, fontSize: 10.5, lineHeight: 1.35 }}>What would make today feel kinder?</div></div>
                  <div style={{ flex: 1, padding: "10px", borderRadius: 13, background: "rgba(255,255,255,.82)", border: "1px solid #E8D2E8" }}><div style={{ fontSize: 8.5, fontWeight: 900, color: colors.mint }}>PROGRESS</div><div style={{ marginTop: 5, fontSize: 19, fontWeight: 900 }}>2 / 4</div><div style={{ fontSize: 8.5, color: colors.soft }}>gentle steps</div></div>
                </div>
                <div style={{ marginTop: 13, fontSize: 9, fontWeight: 900, letterSpacing: ".12em", color: colors.soft }}>TODAY</div>
                {[["✓","Drink water",true],["✓","Morning medicine",true],["","Ten-minute tidy",false],["","Prepare for tomorrow",false]].map(([mark,label,done]) => (
                  <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 7, padding: "9px", borderRadius: 11, background: "rgba(255,255,255,.9)", border: "1px solid #E8D2E8", color: done ? colors.soft : colors.plum, fontSize: 10.5, fontWeight: 800, textDecoration: done ? "line-through" : "none" }}><span style={{ width: 17, height: 17, display: "grid", placeItems: "center", borderRadius: 6, background: done ? colors.mint : "transparent", border: `2px solid ${done ? colors.mint : "#D1B8D3"}`, color: "white", fontSize: 9 }}>{mark}</span>{label}</div>
                ))}
                <div style={{ marginTop: 12, padding: "9px", borderRadius: 999, background: "linear-gradient(90deg,#B95FCE,#8A6DE0)", color: "white", textAlign: "center", fontSize: 10.5, fontWeight: 900 }}>🧸 Open PlushRescue</div>
              </div>
            </div>
            <div style={{ marginTop: 13, textAlign: "center", fontSize: 12, color: colors.soft, fontWeight: 800 }}>Plan · Reflect · See patterns</div>
          </div>
          <div className="landing-watch-wrap">
            <div className="landing-watch-strap upper" />
            <div className="landing-watch" aria-label="Example PlushLife Amazfit watch screen">
              <div className="landing-watch-screen">
                <div style={{ fontSize: 9, fontWeight: 900, letterSpacing: ".12em", color: colors.orchid }}>PLUSHLIFE</div>
                <div style={{ marginTop: 4, fontFamily: "'Baloo 2',sans-serif", fontSize: 17, fontWeight: 900 }}>How are you?</div>
                <div style={{ display: "flex", justifyContent: "center", gap: 6, marginTop: 8 }}><span style={{ padding: "7px 9px", borderRadius: 999, background: "white", fontSize: 15 }}>😌</span><span style={{ padding: "7px 9px", borderRadius: 999, background: colors.orchid, boxShadow: "0 5px 12px rgba(185,95,206,.28)", fontSize: 15 }}>🙂</span><span style={{ padding: "7px 9px", borderRadius: 999, background: "white", fontSize: 15 }}>😣</span></div>
                <div style={{ marginTop: 9, fontSize: 10.5, fontWeight: 900 }}>Okay · Soft</div>
                <div style={{ marginTop: 8, padding: "7px 10px", borderRadius: 999, background: "#4A3A5C", color: "white", fontSize: 9.5, fontWeight: 900 }}>Tiny Step → water</div>
                <div style={{ marginTop: 6, color: colors.orchid, fontSize: 9, fontWeight: 900 }}>🛟 Rescue</div>
              </div>
            </div>
            <div className="landing-watch-strap lower" />
            <div style={{ marginTop: 12, textAlign: "center", fontSize: 12, color: colors.soft, fontWeight: 800 }}>Check in · Focus · Get support</div>
          </div>
        </div>
        <div style={{ marginTop: 12, textAlign: "center", color: colors.soft, fontSize: 10.5 }}>Illustrative product preview. Watch features and availability may vary by supported device.</div>
      </section>

      <section aria-label="Interactive PlushLife demo" style={{ padding: "34px 20px 70px", display: "grid", justifyItems: "center" }}>
        <div style={{ textAlign: "center", marginBottom: 14 }}>
          <div style={{ fontFamily: "'Baloo 2',sans-serif", fontSize: 24, fontWeight: 800 }}>Try a tiny PlushLife 💛</div>
          <div style={{ marginTop: 3, color: colors.soft, fontSize: 13.5 }}>Tap the sample tasks. This demo doesn’t save anything.</div>
        </div>
        <div style={{ width: "min(100%, 390px)", background: "#FFFFFFEE", borderRadius: 32, padding: 14, boxSizing: "border-box", boxShadow: "0 22px 55px -22px rgba(90,50,110,.3)", border: `1px solid ${colors.line}` }}>
          <div style={{ position: "relative", overflow: "hidden", background: "linear-gradient(160deg,#FDECFA,#E8F8F2 60%,#FFF6E2)", borderRadius: 22, padding: "18px 16px", minHeight: 340 }}>
            {demoCelebrating && (
              <div role="status" aria-live="polite" style={{ position: "absolute", inset: 0, zIndex: 3, display: "grid", placeItems: "center", padding: 18, background: "rgba(255,250,253,.93)", textAlign: "center", animation: "demoPop .45s ease-out" }}>
                <div>
                  <div aria-hidden="true" style={{ fontSize: 54, animation: "demoSparkle .8s ease-in-out infinite" }}>🧸✨</div>
                  <div style={{ marginTop: 4, fontFamily: "'Baloo 2',sans-serif", fontSize: 25, fontWeight: 800, color: colors.orchid }}>You finished the demo!</div>
                  <div style={{ marginTop: 4, color: colors.soft, fontSize: 13, lineHeight: 1.45 }}>That’s how a completed PlushLife day feels—warm progress, no pressure.</div>
                  <button type="button" onClick={resetDemo} style={{ marginTop: 13, padding: "10px 17px", borderRadius: 999, border: 0, background: colors.orchid, color: "white", fontWeight: 900, cursor: "pointer" }}>Try it again</button>
                </div>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 10 }}>
              <div>
                <div style={{ fontSize: 9, letterSpacing: ".18em", color: colors.soft, fontWeight: 800 }}>DEMO DAILY LIST</div>
                <div style={{ fontSize: 18, fontWeight: 900, marginTop: 3 }}>A gentle little day ✨</div>
              </div>
              <div style={{ fontFamily: "'Baloo 2',sans-serif", fontSize: 19, fontWeight: 800, color: colors.orchid }}>{demoPercent}%</div>
            </div>
            <div aria-label={`${demoPercent}% complete`} style={{ height: 10, background: "white", borderRadius: 6, overflow: "hidden", margin: "11px 0 13px", border: `1px solid ${colors.line}` }}>
              <div style={{ height: "100%", width: `${demoPercent}%`, background: `linear-gradient(90deg,${colors.orchid},${colors.mint})`, transition: "width .3s ease" }}/>
            </div>
            {demoTasks.map(([icon, label], index) => {
              const done = demoDone[index];
              return (
                <button key={label} type="button" className="landing-demo-task" aria-pressed={done} onClick={() => toggleDemoTask(index)} style={{ width: "100%", display: "flex", alignItems: "center", gap: 9, background: done ? "#F3FFF9" : "white", border: `1px solid ${done ? "#9EDFCF" : colors.line}`, borderRadius: 12, padding: "10px", marginBottom: 7, fontFamily: "inherit", fontSize: 13, fontWeight: 800, color: done ? colors.soft : colors.plum, textAlign: "left", textDecoration: done ? "line-through" : "none", cursor: "pointer", transition: "transform .15s ease,border-color .15s ease,background .2s ease" }}>
                  <span aria-hidden="true" style={{ fontSize: 18 }}>{icon}</span>
                  <span style={{ width: 20, height: 20, flex: "0 0 auto", borderRadius: 7, border: `2px solid ${done ? colors.mint : "#D8BBD8"}`, background: done ? colors.mint : "transparent", color: "white", display: "grid", placeItems: "center", fontSize: 12 }}>{done ? "✓" : ""}</span>
                  <span>{label}</span>
                </button>
              );
            })}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 10 }}>
              <div style={{ color: colors.soft, fontSize: 11.5, fontWeight: 700 }}>{demoCompleted}/{demoTasks.length} gentle steps complete</div>
              {demoCompleted > 0 && <button type="button" onClick={resetDemo} style={{ padding: "6px 10px", borderRadius: 999, border: `1px solid ${colors.line}`, background: "white", color: colors.soft, fontWeight: 800, cursor: "pointer" }}>Reset</button>}
            </div>
          </div>
        </div>
      </section>

      <section id="landing-features" style={{ padding: "20px 28px 80px", maxWidth: 1080, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <h2 style={{ fontFamily: "'Baloo 2',sans-serif", fontSize: "clamp(28px,4vw,38px)", margin: "0 0 10px" }}>Everything soft, in one place</h2>
          <p style={{ color: colors.soft, fontSize: 16 }}>Real tools for planning, hard moments, reflection, and support—without guilt or paywalls.</p>
        </div>
        <div className="plush-feature-grid">
          {[
            ["🌤️","PlushList + Capacity Modes","A plan that meets you where you are","Choose a Full, Soft, Tiny, or Recovery Day. Smaller versions of habits mean caring for yourself still counts when energy is low."],
            ["🛟","PlushCare + PlushRescue","Support for the moment you’re in","Open quick grounding tools, calming care, sleep support, and guided PlushPaths when everything feels like too much."],
            ["📓","Check-ins + PlushJournal","Understand your days gently","Notice moods, energy, wins, and hard moments in one private place. Look back for useful patterns without judgment or diagnosis."],
            ["📅","Schedule + Progress","Turn intentions into a doable day","Bring routines, habits, self-care, and workouts together. See what is next and celebrate progress without losing it after a missed day."],
            ["🎯","Focus Mode","One calm step at a time","When a full list feels overwhelming, Focus Mode shows just the next step—larger, quieter, and easier to begin."],
            ["💛","Guardian Support","Invite support on your terms","A trusted person can check in and send encouragement. You decide what they can see, and you can pause or remove access anytime."],
          ].map(([icon,tag,title,text]) => (
            <div className="landing-feature-card" key={title} style={{ background: "white", border: `1px solid ${colors.line}`, borderRadius: 24, padding: "27px 26px", boxShadow: "0 12px 30px -18px rgba(90,50,110,.2)" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}><span style={{ fontSize: 34 }}>{icon}</span><span className="landing-feature-tag">{tag}</span></div><h3 style={{ fontFamily: "'Baloo 2',sans-serif", fontSize: 20, margin: "14px 0 10px" }}>{title}</h3><p style={{ color: colors.soft, fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="landing-how" style={{ padding: "0 28px 80px", maxWidth: 980, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div style={{ color: colors.orchid, fontSize: 11, fontWeight: 900, letterSpacing: ".13em" }}>HOW PLUSHLIFE HELPS</div>
          <h2 style={{ fontFamily: "'Baloo 2',sans-serif", fontSize: "clamp(27px,4vw,36px)", margin: "7px 0 9px" }}>Less pressure. More useful support.</h2>
          <p style={{ color: colors.soft, fontSize: 15.5, maxWidth: 600, margin: "0 auto", lineHeight: 1.6 }}>You do not have to build a perfect routine before PlushLife can help.</p>
        </div>
        <div className="landing-how-grid">
          {[
            ["1","Check in","Tell PlushLife how you feel and how much capacity you have today."],
            ["2","Choose what fits","Keep the full plan or soften it to the smallest steps that still support you."],
            ["3","Notice what helps","Reflect, celebrate progress, and carry useful patterns into tomorrow."],
          ].map(([number,title,text]) => (
            <div key={number} style={{ background: "rgba(255,255,255,.78)", border: `1px solid ${colors.line}`, borderRadius: 22, padding: "24px 22px", textAlign: "center" }}>
              <div style={{ width: 36, height: 36, display: "grid", placeItems: "center", margin: "0 auto 12px", borderRadius: 999, background: colors.orchid, color: "white", fontFamily: "'Baloo 2',sans-serif", fontWeight: 900 }}>{number}</div>
              <h3 style={{ fontFamily: "'Baloo 2',sans-serif", fontSize: 19, margin: "0 0 7px" }}>{title}</h3>
              <p style={{ color: colors.soft, fontSize: 13.5, lineHeight: 1.55, margin: 0 }}>{text}</p>
            </div>
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: 26 }}>
          <button onClick={() => { setShowSignIn(true); window.scrollTo({ top: 0, behavior: "smooth" }); }} style={{ background: colors.orchid, color: "white", border: 0, padding: "13px 26px", borderRadius: 999, fontWeight: 900, fontSize: 15, cursor: "pointer", boxShadow: "0 12px 24px -10px rgba(185,95,206,.55)" }}>Start with one small step</button>
          <div style={{ marginTop: 8, color: colors.soft, fontSize: 11.5 }}>Enter your email and we’ll send a one-time code. No password needed.</div>
        </div>
      </section>

      <section style={{ padding: "0 28px 70px", maxWidth: 900, margin: "0 auto" }}>
        <div style={{ background: "linear-gradient(135deg, #EAF4FF, #F7ECFB)", borderRadius: 28, padding: "36px 30px", textAlign: "center" }}>
          <div style={{ fontSize: 32 }}>🔒</div>
          <h3 style={{ fontFamily: "'Baloo 2',sans-serif", fontSize: 22, margin: "10px 0 8px", color: colors.plum }}>We will never sell your data. Ever.</h3>
          <p style={{ color: colors.soft, fontSize: 15, lineHeight: 1.6, maxWidth: 560, margin: "0 auto" }}>No ads. No data brokers. No "anonymized insights" quietly sold to anyone. Your habits, moods, and reflections are not a product — they're yours, and you can download or delete them anytime.</p>
        </div>
        <div style={{ marginTop: 30, textAlign: "center" }}>
          <h3 style={{ fontFamily: "'Baloo 2',sans-serif", fontSize: 22, margin: "0 0 10px", color: colors.plum }}>Support that fits real relationships</h3>
          <p style={{ color: colors.soft, fontSize: 15, lineHeight: 1.7, maxWidth: 620, margin: "0 auto" }}>
            A parent gently checking in on a teen. An adult child keeping an eye on an aging parent. A partner supporting a partner through a hard season. PlushLife’s Guardian system was built for the relationships that already exist in your life — not a stranger on a leaderboard.
          </p>
        </div>
      </section>
      <footer style={{ padding: "42px 28px", textAlign: "center", borderTop: `1px solid ${colors.line}`, color: colors.soft, fontSize: 13.5 }}>
          <div style={{ fontFamily: "'Baloo 2',sans-serif", fontWeight: 900, color: colors.plum }}>PlushLife—care that fits today.</div>
        <div style={{ marginTop: 4 }}>Made for days that need structure, and ones that need softness.</div>
        <div style={{ marginTop: 10 }}>© 2026 Sable Johnston · PlushLife™ · All rights reserved.</div>
        <div style={{ marginTop: 6 }}>
          <a href="./legal.html#privacy" style={{ color: colors.orchid }}>Privacy</a>
          <span aria-hidden="true"> · </span>
          <a href="./legal.html#terms" style={{ color: colors.orchid }}>Terms</a>
          <span aria-hidden="true"> · </span>
          <a href="./legal.html#about" style={{ color: colors.orchid }}>About</a>
          <span aria-hidden="true"> · </span>
          <a href="./support.html" style={{ color: colors.orchid }}>Support</a>
        </div>
      </footer>
    </div>
  );
}
