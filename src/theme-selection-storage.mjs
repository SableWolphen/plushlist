import { companionAccountKey } from "./companion-account-storage.mjs";

export const THEME_PREFERENCE_KEYS = Object.freeze([
  "appearance_theme", "nickname_style", "dino_theme", "dark_mode", "baby_voice",
]);

export function hasThemePreferenceChange(patch) {
  return !!patch && THEME_PREFERENCE_KEYS.some((key) => Object.prototype.hasOwnProperty.call(patch, key));
}

export function themeSelectionKey(userId) {
  return companionAccountKey("appearance-choice:v1", userId);
}

function themeValues(value) {
  const next = {};
  if (!value || typeof value !== "object" || Array.isArray(value)) return next;
  if (typeof value.appearance_theme === "string" && /^[a-z][a-z0-9-]{0,39}$/.test(value.appearance_theme)) {
    next.appearance_theme = value.appearance_theme;
  }
  if (typeof value.nickname_style === "string" && /^[a-z][a-z0-9-]{0,39}$/.test(value.nickname_style)) {
    next.nickname_style = value.nickname_style;
  }
  if (typeof value.dino_theme === "boolean") next.dino_theme = value.dino_theme;
  if (typeof value.dark_mode === "boolean") next.dark_mode = value.dark_mode;
  if (value.baby_voice === "motherly" || value.baby_voice === "fatherly") next.baby_voice = value.baby_voice;
  return next;
}

export function readThemeSelection(storage, userId) {
  const key = themeSelectionKey(userId);
  if (!key) return null;
  try {
    const saved = JSON.parse(storage?.getItem(key) || "null");
    if (saved?.version !== 1 || !saved.values || typeof saved.revision !== "string") return null;
    const values = themeValues(saved.values);
    return Object.keys(values).length ? { values, revision: saved.revision, pending: saved.pending === true } : null;
  } catch (_) { return null; }
}

// Writes happen synchronously BEFORE the cloud request. If Android closes or
// the network is offline, this Cozy's chosen world can still be restored.
export function rememberThemeSelection(storage, userId, patch) {
  const key = themeSelectionKey(userId);
  if (!key || !hasThemePreferenceChange(patch)) return null;
  const values = { ...(readThemeSelection(storage, userId)?.values || {}), ...themeValues(patch) };
  const revision = String(Date.now()) + ":" + Math.random().toString(36).slice(2);
  try {
    storage.setItem(key, JSON.stringify({ version: 1, values, revision, pending: true }));
    return { values, revision, pending: true };
  } catch (_) { return null; }
}

export function acknowledgeThemeSelection(storage, userId, revision) {
  const key = themeSelectionKey(userId);
  if (!key || !revision) return false;
  const current = readThemeSelection(storage, userId);
  if (!current || current.revision !== revision) return false;
  try {
    storage.setItem(key, JSON.stringify({ version: 1, ...current, pending: false }));
    return true;
  } catch (_) { return false; }
}

export function restoreThemePreferences(remote, local) {
  // An account-bound choice made on this device takes precedence over a stale
  // network snapshot. Fresh devices without a local choice use cloud settings.
  return { ...remote, ...(local?.values || {}) };
}
