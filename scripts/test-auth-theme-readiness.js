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
expect(login.includes('id="mobileEmailToggle"') && login.includes('id="emailShell"'), "Mobile login must collapse email sign-in behind one compact control");
expect(login.includes('.plans{display:none}') && login.includes('.intro{display:none}'), "Mobile login must hide desktop-only marketing content");
expect(login.includes('body.mobile-code-ready .email-shell .code-stage{display:block}'), "Mobile email code field must stay hidden until needed");

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

console.log("Auth/theme readiness checks passed: Google entry point, compact mobile login, Android callback, fallbacks, and System/Light/Dark appearance are wired.");
