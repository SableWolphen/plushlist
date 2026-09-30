(function () {
  "use strict";

  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__plushlifeComebackReminderInstalled) return;
  window.__plushlifeComebackReminderInstalled = true;

  const REMINDER_ID = 730300001;
  const STATE_KEY = "plushlife:comeback-reminder:v1";
  // Per-user opt-out, separate from task/daily reminders. The settings UI
  // toggles this via window.PlushLifeComebackReminder.setOptOut(boolean).
  const OPT_OUT_KEY = "plushlife:comeback-reminder-optout:v1";
  const AWAY_MS = 60 * 60 * 1000 * 60; // 60 hours = 2.5 days

  function isOptedOut() {
    if (window.PlushLifeCozyPreferences) return !window.PlushLifeCozyPreferences.enabled;
    try { return window.localStorage.getItem(OPT_OUT_KEY) === "1"; }
    catch (_error) { return false; }
  }

  function readState() {
    try { return JSON.parse(localStorage.getItem(STATE_KEY) || "{}") || {}; }
    catch (_error) { return {}; }
  }

  function saveState(patch) {
    try { localStorage.setItem(STATE_KEY, JSON.stringify({ ...readState(), ...(patch || {}) })); }
    catch (_error) {}
  }

  function clean(value) {
    return String(value || "").replace(/\s+/g, " ").trim();
  }

  function isSignedOut() {
    const email = document.querySelector('input[type="email"]');
    if (email && email.getClientRects?.().length) return true;
    return Array.from(document.querySelectorAll("button,a")).some((node) => {
      if (!node.getClientRects?.().length) return false;
      return /^(start free|start your list|send code|sign in)$/i.test(clean(node.textContent));
    });
  }

  function plugin() {
    return window.Capacitor?.Plugins?.LocalNotifications || window.LocalNotifications || null;
  }

  async function permissionGranted(target) {
    if (!target?.checkPermissions) return false;
    try {
      const permission = await target.checkPermissions();
      const value = permission?.display || permission?.receive || permission?.notifications;
      return value === "granted";
    } catch (_error) {
      return false;
    }
  }

  async function cancelReminder() {
    const target = plugin();
    if (!target?.cancel) return;
    try { await target.cancel({ notifications: [{ id: REMINDER_ID }] }); }
    catch (_error) {}
  }

  function reminderTime() {
    const config = window.PlushLifeCozyPreferences;
    const at = new Date(Date.now() + AWAY_MS);
    const clock = /^([01]\d|2[0-3]):[0-5]\d$/.test(config?.reminderTime || "") ? config.reminderTime : "09:30";
    const parts = clock.split(":").map(Number);
    const earliest = at.getTime();
    at.setHours(parts[0],parts[1],0,0);
    if(at.getTime()<earliest)at.setDate(at.getDate()+1);
    const minutes = value => {const match=/^([01]\d|2[0-3]):([0-5]\d)$/.exec(value || "");return match?Number(match[1])*60+Number(match[2]):null;};
    const start=minutes(config?.quietStart) ?? 21*60;
    const end=minutes(config?.quietEnd) ?? 9*60;
    for(let i=0;i<97;i++){
      const m=at.getHours()*60+at.getMinutes();
      const quiet=start<=end?m>=start&&m<end:m>=start||m<end;
      if(!quiet)return at;
      at.setMinutes(at.getMinutes()+15);
    }
    return null;
  }

  async function scheduleReminder() {
    if (isOptedOut() || !window.PlushLifeCozyPreferences?.enabled) {
      // Respect the opt-out: clear any previously scheduled nudge and stop.
      await cancelReminder();
      return;
    }
    if (isSignedOut()) return;
    const config = window.PlushLifeCozyPreferences;
    const target = plugin();
    if (!target?.schedule) return;
    if (!(await permissionGranted(target))) return;
    if (config !== window.PlushLifeCozyPreferences || !config?.enabled) return;

    const at = reminderTime();
    if (!at) return;
    try {
      await cancelReminder();
      if (config !== window.PlushLifeCozyPreferences || !config?.enabled) return;
      await target.schedule({
        notifications: [{
          id: REMINDER_ID,
          title: config.copy.title,
          body: config.copy.body,
          schedule: { at, allowWhileIdle: true },
          channelId: "plushlife-reminders",
          extra: { source: "comeback-reminder" },
        }],
      });
      if (config !== window.PlushLifeCozyPreferences || !config?.enabled) { await cancelReminder(); return; }
      saveState({ scheduledFor: at.toISOString(), lastScheduledAt: new Date().toISOString() });
    } catch (_error) {}
  }

  async function markActive() {
    saveState({ lastActiveAt: new Date().toISOString() });
    await cancelReminder();
  }

  let hiddenTimer = null;
  function onVisibilityChange() {
    if (document.visibilityState === "visible") {
      if (hiddenTimer) window.clearTimeout(hiddenTimer);
      hiddenTimer = null;
      markActive();
      return;
    }
    if (hiddenTimer) window.clearTimeout(hiddenTimer);
    hiddenTimer = window.setTimeout(scheduleReminder, 500);
  }

  window.addEventListener("plushlife:cozy-preferences-changed", () => {
    if (!window.PlushLifeCozyPreferences?.enabled) cancelReminder();
    else if(document.visibilityState !== "visible") scheduleReminder();
  });
  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pagehide", scheduleReminder);

  try {
    const app = window.Capacitor?.Plugins?.App;
    app?.addListener?.("appStateChange", ({ isActive }) => {
      if (isActive) markActive();
      else scheduleReminder();
    });
  } catch (_error) {}

  if (document.visibilityState === "visible") markActive();

  // Public API for the settings UI: a visible per-user opt-out for the
  // comeback nudge, independent of the task/daily reminder toggles.
  window.PlushLifeComebackReminder = {
    isOptedOut,
    setOptOut(value) {
      try {
        if (value) window.localStorage.setItem(OPT_OUT_KEY, "1");
        else window.localStorage.removeItem(OPT_OUT_KEY);
      } catch (_error) {}
      if (value) cancelReminder();
      window.dispatchEvent(new CustomEvent("plushlife:comeback-reminder-optout-changed", {
        detail: { optedOut: !!value },
      }));
      return !!value;
    },
  };
})();
