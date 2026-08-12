const fs = require("fs");

function read(path) { return fs.readFileSync(path, "utf8"); }
function write(path, value) { fs.writeFileSync(path, value); }
function replaceOnce(source, needle, replacement, label) {
  if (!source.includes(needle)) throw new Error(`Missing marker: ${label}`);
  return source.replace(needle, replacement);
}

// Main signed-out landing/sign-in experience.
{
  const path = "src/components/landing.jsx";
  let source = read(path);
  source = replaceOnce(
    source,
    '        @media(max-width:560px){.landing-nav-links{display:none}.landing-benefit-strip{grid-template-columns:1fr 1fr;gap:7px;padding:0 14px}.landing-benefit-pill{border-radius:15px;font-size:11px;padding:7px}.landing-signin-row{flex-direction:column}.landing-signin-row button{width:100%}.landing-difference-cell{min-height:96px;padding:15px 13px}}',
    '        .landing-tier-grid { display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-top:12px;text-align:left }\n        .landing-tier-card { padding:12px;border-radius:14px;border:1px solid #EADCEC;background:#FFF }\n        .landing-tier-card.gold { border-color:#E0B6EA;background:linear-gradient(145deg,#FFF8FE,#F4FCF9);box-shadow:0 10px 24px -20px rgba(126,69,145,.55) }\n        .landing-tier-list { margin:7px 0 0;padding:0;list-style:none;display:grid;gap:4px;color:#6E5A82;font-size:11px;line-height:1.35 }\n        @media(max-width:560px){.landing-nav-links{display:none}.landing-benefit-strip{grid-template-columns:1fr 1fr;gap:7px;padding:0 14px}.landing-benefit-pill{border-radius:15px;font-size:11px;padding:7px}.landing-signin-row{flex-direction:column}.landing-signin-row button{width:100%}.landing-difference-cell{min-height:96px;padding:15px 13px}.landing-tier-grid{grid-template-columns:1fr}}',
    "landing tier styles",
  );

  source = replaceOnce(
    source,
    '          <div style={{ maxWidth: 480, margin: "22px auto 0", padding: 16, borderRadius: 18, background: "rgba(255,255,255,.86)", border: `1px solid ${colors.line}`, boxShadow: "0 18px 38px -24px rgba(90,50,110,.35)" }}>\n            <div style={{ fontFamily: "\'Baloo 2\',sans-serif", fontSize: 20, fontWeight: 800 }}>Create or open your private tracker</div>\n            <div style={{ marginTop: 3, fontSize: 13, color: colors.soft }}>We’ll email you a secure one-time sign-in code.</div>',
    '          <div style={{ maxWidth: 660, margin: "22px auto 0", padding: 16, borderRadius: 18, background: "rgba(255,255,255,.86)", border: `1px solid ${colors.line}`, boxShadow: "0 18px 38px -24px rgba(90,50,110,.35)" }}>\n            <div style={{ fontFamily: "\'Baloo 2\',sans-serif", fontSize: 20, fontWeight: 800 }}>Create or open your private tracker</div>\n            <div style={{ marginTop: 3, fontSize: 13, color: colors.soft }}>Choose the level of support that fits you. <strong>Gold is included free for everyone during preview.</strong></div>\n            <div className="landing-tier-grid" aria-label="PlushLife Free and Plush Gold comparison">\n              <div className="landing-tier-card">\n                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>\n                  <strong style={{ fontSize: 13.5 }}>🧸 PlushLife Free</strong><span style={{ fontSize: 10, fontWeight: 900, color: colors.mint }}>CORE</span>\n                </div>\n                <ul className="landing-tier-list">\n                  <li>✓ Today, habits & tasks</li><li>✓ Focus Habit & check-ins</li><li>✓ Basic reminders & progress</li><li>✓ Baby Mode, Low Screen & care tools</li>\n                </ul>\n              </div>\n              <div className="landing-tier-card gold">\n                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>\n                  <strong style={{ fontSize: 13.5 }}>✨ Plush Gold</strong><span style={{ padding: "2px 6px", borderRadius: 999, background: "#F2E4F7", color: "#8E4EAA", fontSize: 9.5, fontWeight: 900 }}>FREE PREVIEW</span>\n                </div>\n                <ul className="landing-tier-list">\n                  <li>✓ Everything in Free</li><li>✓ Smarter Next Step intelligence</li><li>✓ Advanced PlushGrowth insights</li><li>✓ Adaptive coaching & recovery patterns</li>\n                </ul>\n              </div>\n            </div>\n            <div style={{ marginTop: 8, fontSize: 11.5, color: colors.soft }}>No payment is required right now. If Gold becomes paid later, the core Free experience will stay available.</div>\n            <div style={{ marginTop: 11, fontSize: 12.5, color: colors.soft }}>We’ll email you a secure one-time sign-in code.</div>',
    "landing sign-in comparison",
  );
  write(path, source);
}

// Dedicated login.html fallback/reviewer sign-in page.
{
  const path = "login.html";
  let source = read(path).replace(/\r\n/g, "\n");
  source = replaceOnce(source, '      width: min(100%, 470px);', '      width: min(100%, 640px);', "login width");
  source = replaceOnce(
    source,
    '    .legal a { color: #9c5fb5; }',
    '    .legal a { color: #9c5fb5; }\n    .tier-grid { display:grid;grid-template-columns:1fr 1fr;gap:10px;margin:0 0 18px; }\n    .tier-card { padding:13px;border:1px solid #eadcec;border-radius:15px;background:#fff; }\n    .tier-card.gold { border-color:#dfb5e9;background:linear-gradient(145deg,#fff8fe,#f3fbf8); }\n    .tier-title { display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:14px;font-weight:900; }\n    .preview-badge { padding:3px 7px;border-radius:999px;background:#f1e3f6;color:#8e4eaa;font-size:9px;font-weight:900;white-space:nowrap; }\n    .tier-list { margin:8px 0 0;padding:0;list-style:none;display:grid;gap:5px;color:#756483;font-size:11.5px;line-height:1.35; }\n    .tier-note { margin:-7px 0 18px;padding:9px 10px;border-radius:11px;background:#f7f2fa;color:#756483;font-size:11.5px;line-height:1.4;text-align:center; }\n    @media(max-width:560px){ .tier-grid{grid-template-columns:1fr} main{padding:20px} }',
    "login tier styles",
  );
  source = replaceOnce(
    source,
    '    <p class="intro">Enter your email, then use the one-time code we send you.</p>\n\n    <label for="email">Email address</label>',
    '    <p class="intro">Sign in to the same private tracker on Free or Gold. Gold is included free during preview.</p>\n\n    <div class="tier-grid" aria-label="PlushLife Free and Plush Gold comparison">\n      <div class="tier-card">\n        <div class="tier-title"><span>🧸 PlushLife Free</span><span style="font-size:9px;color:#3f9c86">CORE</span></div>\n        <ul class="tier-list"><li>✓ Today, habits & tasks</li><li>✓ Focus Habit & check-ins</li><li>✓ Basic reminders & progress</li><li>✓ Baby Mode, Low Screen & care tools</li></ul>\n      </div>\n      <div class="tier-card gold">\n        <div class="tier-title"><span>✨ Plush Gold</span><span class="preview-badge">FREE PREVIEW</span></div>\n        <ul class="tier-list"><li>✓ Everything in Free</li><li>✓ Smarter Next Step intelligence</li><li>✓ Advanced PlushGrowth insights</li><li>✓ Adaptive coaching & recovery patterns</li></ul>\n      </div>\n    </div>\n    <div class="tier-note"><strong>No payment required right now.</strong> If Gold becomes paid later, the core Free experience stays available.</div>\n\n    <label for="email">Email address</label>',
    "login tier comparison",
  );
  write(path, source);
}

// Regression coverage for clear, non-misleading Free vs Gold login messaging.
{
  const path = "scripts/test-product-quality.js";
  let source = read(path);
  source = replaceOnce(
    source,
    'const goldPreview = read("src/components/plush-gold-preview.jsx");\n',
    'const goldPreview = read("src/components/plush-gold-preview.jsx");\nconst landing = read("src/components/landing.jsx");\nconst loginPage = read("login.html");\n',
    "login test reads",
  );
  source = replaceOnce(
    source,
    'const checks = [\n',
    'const checks = [\n  [landing.includes("PlushLife Free") && landing.includes("Plush Gold") && landing.includes("FREE PREVIEW"), "signed-out landing compares Free and Gold"],\n  [loginPage.includes("PlushLife Free") && loginPage.includes("Plush Gold") && loginPage.includes("FREE PREVIEW"), "dedicated login page compares Free and Gold"],\n  [landing.includes("No payment is required right now") && loginPage.includes("No payment required right now"), "login tier comparison clearly keeps Gold free during preview"],\n',
    "login tier checks",
  );
  write(path, source);
}

console.log("Login Free vs Gold comparison applied.");
