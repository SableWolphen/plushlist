(function () {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__plushlifeLandingMobileAuthInstalled) return;
  window.__plushlifeLandingMobileAuthInstalled = true;

  const mobile = window.matchMedia("(max-width: 680px)");
  const SIGN_IN_URL = "./login.html";
  let scheduled = false;

  const nativeApp = Boolean(window.Capacitor?.isNativePlatform?.());
  if (nativeApp) document.documentElement.classList.add("plushlife-native-landing");

  function isMobile() {
    return mobile.matches;
  }

  function goToCompactSignIn(event) {
    if (!isMobile()) return;
    const button = event.target?.closest?.("button");
    if (!button) return;
    const label = String(button.textContent || "").trim().toLowerCase();
    if (label !== "start free" && label !== "start your list") return;
    event.preventDefault();
    event.stopPropagation();
    if (typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
    window.location.href = SIGN_IN_URL;
  }

  function findEmbeddedAuthCard() {
    const heading = Array.from(document.querySelectorAll("div")).find((node) =>
      node.children.length === 0 && /create or open your private tracker/i.test(node.textContent || "")
    );
    return heading?.parentElement || null;
  }

  function ensureCompactCard() {
    const card = findEmbeddedAuthCard();
    if (!card) return;
    card.classList.add("plushlife-landing-embedded-auth");
    if (!card.querySelector("[data-plushlife-mobile-auth-cta='true']")) {
      const compact = document.createElement("div");
      compact.dataset.plushlifeMobileAuthCta = "true";
      compact.innerHTML = `
        <a class="plushlife-mobile-auth-primary" href="${SIGN_IN_URL}">Continue to sign in</a>
        <div class="plushlife-mobile-auth-note">Google, email code, or password</div>
      `;
      card.appendChild(compact);
    }
  }

  function refresh() {
    if (!isMobile()) return;
    ensureCompactCard();
  }

  function scheduleRefresh() {
    if (scheduled) return;
    scheduled = true;
    window.requestAnimationFrame(() => {
      scheduled = false;
      refresh();
    });
  }

  const style = document.createElement("style");
  style.id = "plushlife-landing-mobile-auth";
  style.textContent = `
    [data-plushlife-mobile-auth-cta="true"] { display:none; }
    @media (max-width:680px) {
      .plushlife-native-landing .plushlife-landing-root { min-height:100dvh !important; }
      .plushlife-native-landing .plushlife-landing-nav { padding:14px 16px 8px !important; }
      .plushlife-native-landing .plushlife-landing-hero { padding:10px 16px 8px !important; }
      .plushlife-native-landing .plushlife-landing-hero > span { margin-bottom:10px !important; padding:4px 10px !important; font-size:9px !important; }
      .plushlife-native-landing .plushlife-landing-hero h1 { margin-bottom:10px !important; font-size:32px !important; line-height:1.04 !important; }
      .plushlife-native-landing .plushlife-landing-hero > p { margin-bottom:16px !important; font-size:14px !important; line-height:1.42 !important; }
      .plushlife-native-landing .plushlife-landing-hero > div > button { padding:12px 22px !important; font-size:14px !important; }
      .plushlife-native-landing .plushlife-landing-hero > div > button:last-child,
      .plushlife-native-landing .plushlife-landing-mascot,
      .plushlife-native-landing .landing-detail-section,
      .plushlife-native-landing .plushlife-landing-footer { display:none !important; }
      .plushlife-native-landing .landing-benefit-strip { margin-top:8px !important; padding:0 16px 16px !important; gap:6px !important; }
      .plushlife-native-landing .landing-benefit-pill { min-height:38px !important; padding:6px 7px !important; font-size:10.5px !important; }
      .plushlife-landing-embedded-auth {
        max-width:420px !important;
        margin:14px auto 0 !important;
        padding:12px !important;
        border-radius:16px !important;
      }
      .plushlife-landing-embedded-auth > * { display:none !important; }
      .plushlife-landing-embedded-auth > :first-child { display:block !important; font-size:17px !important; line-height:1.2 !important; }
      .plushlife-landing-embedded-auth > [data-plushlife-mobile-auth-cta="true"] { display:block !important; }
      .plushlife-mobile-auth-primary {
        display:grid;
        place-items:center;
        width:100%;
        min-height:48px;
        margin-top:9px;
        padding:11px 14px;
        border-radius:12px;
        background:#B95FCE;
        color:white !important;
        text-decoration:none;
        font-size:14px;
        font-weight:900;
        box-shadow:0 10px 22px -14px rgba(185,95,206,.7);
      }
      .plushlife-mobile-auth-note {
        margin-top:7px;
        color:#8574A0;
        font-size:10.5px;
        line-height:1.3;
      }
    }
  `;
  document.head.appendChild(style);

  document.addEventListener("click", goToCompactSignIn, true);
  new MutationObserver(scheduleRefresh).observe(document.documentElement, { childList: true, subtree: true });
  if (typeof mobile.addEventListener === "function") mobile.addEventListener("change", scheduleRefresh);
  else if (typeof mobile.addListener === "function") mobile.addListener(scheduleRefresh);

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scheduleRefresh, { once: true });
  else scheduleRefresh();
})();
