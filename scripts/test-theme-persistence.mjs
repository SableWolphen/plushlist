import assert from "node:assert/strict";
import fs from "node:fs";
import {
  hasThemePreferenceChange, readThemeSelection, rememberThemeSelection,
  acknowledgeThemeSelection, restoreThemePreferences, themeSelectionKey,
} from "../src/theme-selection-storage.mjs";

const a = "00000000-0000-4000-8000-000000000001";
const b = "00000000-0000-4000-8000-000000000002";
const entries = new Map();
const storage = {
  getItem: key => entries.get(key) ?? null,
  setItem: (key, value) => entries.set(key, value),
};
assert.notEqual(themeSelectionKey(a), themeSelectionKey(b));
assert.equal(themeSelectionKey(null), null);
assert.equal(rememberThemeSelection(storage, null, { appearance_theme: "pink" }), null);
assert.equal(hasThemePreferenceChange({ dark_mode: true }), true);
assert.equal(hasThemePreferenceChange({ notifications_enabled: true }), false);

// Selecting any theme must survive a simulated Android process termination.
let changed = rememberThemeSelection(storage, a, { appearance_theme: "strawberry", nickname_style: "warm", dino_theme: false });
assert.equal(readThemeSelection(storage, a).values.appearance_theme, "strawberry");
assert.equal(readThemeSelection(storage, b), null, "A different Cozy must never see this choice");
let reopened = readThemeSelection(storage, a);
assert.equal(restoreThemePreferences({ appearance_theme: "soft", dark_mode: false }, reopened).appearance_theme, "strawberry", "Old network snapshots must not reset the device-selected theme");
assert.equal(acknowledgeThemeSelection(storage, a, changed.revision), true);

// A slow cloud response for the previous choice may not mark the new one saved.
const oldRevision = changed.revision;
changed = rememberThemeSelection(storage, a, { appearance_theme: "mint", dark_mode: true });
assert.equal(acknowledgeThemeSelection(storage, a, oldRevision), false);
assert.equal(readThemeSelection(storage, a).pending, true);
assert.equal(readThemeSelection(storage, a).values.dark_mode, true);
assert.equal(readThemeSelection(storage, a).values.appearance_theme, "mint");

// Dino, Nursery and voice options are part of the SAME account-bound cache.
changed = rememberThemeSelection(storage, a, { dino_theme: true, nickname_style: "warm" });
assert.equal(readThemeSelection(storage, a).values.dino_theme, true);
changed = rememberThemeSelection(storage, a, { nickname_style: "baby", dino_theme: false, baby_voice: "fatherly" });
reopened = readThemeSelection(storage, a);
assert.deepEqual(
  [reopened.values.nickname_style, reopened.values.dino_theme, reopened.values.baby_voice, reopened.values.dark_mode],
  ["baby", false, "fatherly", true],
  "Nursery/Daddy and dark mode should survive a cold restart together",
);
assert.equal(acknowledgeThemeSelection(storage, a, changed.revision), true);
assert.equal(readThemeSelection(storage, a).pending, false);
assert.equal(restoreThemePreferences({ nickname_style: "warm", dino_theme: true }, reopened).nickname_style, "baby");
assert.equal(rememberThemeSelection(storage, a, { notifications_enabled: true }), null);
assert.equal(readThemeSelection(storage, a).values.nickname_style, "baby");
const none = rememberThemeSelection(storage, b, { appearance_theme: "none", dark_mode: false });
assert.equal(readThemeSelection(storage, b).values.appearance_theme, "none");
assert.equal(restoreThemePreferences({ appearance_theme: "soft" }, readThemeSelection(storage, b)).appearance_theme, "none");
assert.equal(readThemeSelection(storage, a).values.appearance_theme, "mint");
assert.equal(none.pending, true);

const app = fs.readFileSync("src/app-source.jsx", "utf8");
assert(app.includes("rememberThemeSelection(window.localStorage, user.id, patch)"), "Every selected theme must be saved synchronously before network I/O");
assert(app.includes("restoreThemePreferences(data, cachedTheme)"), "Hydration must not replace a newer device-selected theme");
assert(app.includes("if (cachedTheme?.pending)"), "Interrupted theme saves must retry after reopening");
assert(app.includes("preferenceSaveChainRef.current.then(write, write)"), "Cloud preference writes must be serialized");
assert(app.includes("version === preferenceSaveVersionRef.current"), "Late preference saves must not overwrite a newer selection");
assert(app.includes("setAppearanceTheme(\"none\")"), "Account switching must clear the prior Cozy's theme");
assert(app.includes('nickname_style: "warm"') && app.includes('dino_theme: false'), "Switching accounts must clear old Nursery and Dino state");
console.log("Theme cold restart, Dino/Nursery, light/dark, stale-cloud response, write order and account isolation passed.");
