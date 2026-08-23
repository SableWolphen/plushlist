#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const failures = [];

const login = read("login.html");
const manifest = read("android/app/src/main/AndroidManifest.xml");
const entitlements = read("assets/entitlements.js");
const darkMode = read("assets/dark-mode.js");
const landingMobileAuth = read("assets/landing-mobile-auth.js");
const landing = read("src/components/landing.jsx");
const googleSetup = read("docs/google-sign-in-setup.md");

function expect(value, message) {
  if (!value) failures.push(message);
}

expect(login.includes('id="googleSignIn"'), "Login must expose a Google sign-in button");
expect(/provider\s*:\s*["']google["']/.test(login), "Login must call Supabase Google OAuth");
expect(/redirectTo\s*:\s*nativeApp\s*\?\s*nativeRedirect\s*:\s*webRedirect/.test(login), "Google OAuth must use platform-specific redirect targets");
expect(/skipBrowserRedirect\s*:\s*nativeApp/.test(login), "Native Google OAuth should obtain the authorization URL before leaving the app");
expect(login.includes('client.auth.setSession') || login.includes('exchangeCodeForSession'), "Native OAuth callback must finish a Supabase session");
expect(login.includes("signInWithOtp") && login.includes("signInWithPassword"), "Email code and password fallbacks must remain available");
expect(login.includes("prefers-color-scheme:dark"), "Login screen should respect device dark appearance");
expect(login.includes("main{width:min(100%,470px)") && login.includes(".plans{display:none}"), "Login stays focused on authentication instead of a long plan comparison");
expect(login.includes(".code-stage{display:none}") && login.includes("body.mobile-code-ready .code-stage{display:block}"), "Email code input stays hidden until a code is requested");
expect(login.includes('id="mobileEmailToggle"') && login.includes('id="emailShell"'), "Mobile login must collapse email sign-in behind one compact control");
expect(login.includes('.plans{display:none}') && login.includes('.intro{display:none}'), "Mobile login must hide desktop-only marketing content");
expect(login.includes('body.mobile-code-ready .code-stage{display:block}'), "Email code field must stay hidden until needed at every viewport size");

expect(entitlements.includes('./assets/landing-mobile-auth.js'), "Main app runtime must load the mobile landing sign-in compactor");
expect(landingMobileAuth.includes('max-width: 680px') || landingMobileAuth.includes('max-width:680px'), "Landing sign-in compactor must be mobile-only");
expect(landingMobileAuth.includes('start free') && landingMobileAuth.includes('start your list'), "Mobile landing start actions must route straight to compact sign-in");
expect(landingMobileAuth.includes('./login.html'), "Mobile landing sign-in must use the standalone compact login page");
expect(landingMobileAuth.includes('window.Capacitor?.isNativePlatform?.()') && landingMobileAuth.includes('plushlife-native-landing'), "Signed-out native apps must show a concise welcome instead of the full marketing page");
expect(landing.includes('landing-detail-section') && landingMobileAuth.includes('.landing-detail-section'), "Native welcome must hide long-form landing details while retaining the short PlushLife introduction");
expect(landingMobileAuth.includes('Create or open your private tracker') || landingMobileAuth.includes('create or open your private tracker'), "Already-open embedded landing auth must be detected and compacted");

expect(manifest.includes('android:scheme="plushlife"'), "Android manifest must register the PlushLife auth callback scheme");
expect(manifest.includes('android:host="login-callback"'), "Android manifest must register the login-callback host");
expect(manifest.includes('android.intent.category.BROWSABLE'), "Android auth callback must be browsable");

expect(entitlements.includes('./assets/dark-mode.js'), "Main app runtime must load dark-mode.js");
expect(darkMode.includes('plushlife:appearance-mode:v1'), "Dark mode preference must persist locally");
expect(darkMode.includes('prefers-color-scheme: dark'), "Dark mode must support following the device setting");
expect(darkMode.includes('setMode: saveMode'), "Dark mode runtime must expose a programmatic mode setter");
expect(darkMode.includes('System') && darkMode.includes('Light') && darkMode.includes('Dark'), "Settings control must expose System, Light, and Dark choices");
expect(darkMode.includes('StatusBar.setStyle'), "Native status bar should follow light/dark appearance");

expect(googleSetup.includes('plushlife://login-callback'), "Google setup docs must name the Android redirect URI");
expect(googleSetup.includes('https://sablewolphen.github.io/plushlist/**'), "Google setup docs must name the web redirect allow-list entry");
expect(/Do not commit the Google client secret/i.test(googleSetup), "Google setup docs must prohibit committing OAuth secrets");

if (failures.length) {
  console.error("Auth/theme readiness checks failed:\n- " + failures.join("\n- "));
  process.exit(1);
}

console.log("Auth/theme readiness checks passed: Google entry point, compact mobile login and landing auth, Android callback, fallbacks, and System/Light/Dark appearance are wired.");
