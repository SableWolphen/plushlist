(function () {
  "use strict";

  if (typeof window === "undefined" || typeof document === "undefined") return;
  if (window.__plushlifeComebackReminderInstalled) return;
  window.__plushlifeComebackReminderInstalled = true;

  const REMINDER_ID = 730300001;
  const STATE_KEY = "plushlife:comeback-reminder:v1";
  const AWAY_MS = 60 * 60 * 1000 * 60; // 60 hours = 2.5 days

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
    const at = new Date(Date.now() + AWAY_MS);
    const hour = at.getHours();
    if (hour < 9) at.setHours(9, 30, 0, 0);
    else if (hour >= 21) {
      at.setDate(at.getDate() + 1);
      at.setHours(9, 30, 0, 0);
    }
    return at;
  }

  async function scheduleReminder() {
    if (isSignedOut()) return;
    const target = plugin();
    if (!target?.schedule) return;
    if (!(await permissionGranted(target))) return;

    const at = reminderTime();
    try {
      await cancelReminder();
      await target.schedule({
        notifications: [{
          id: REMINDER_ID,
          title: "A little PlushLife check-in 💜",
          body: "Been a couple days? You don't have to catch up. Come back Tiny if you need to — one small step still counts.",
          schedule: { at, allowWhileIdle: true },
          channelId: "plushlife-reminders",
          extra: { source: "comeback-reminder" },
        }],
      });
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
})();
