/**
 * src/native-bridge.js
 *
 * Capacitor native bridge for PlushLife (Android): status bar styling,
 * hardware back-button handling, splash-screen dismissal, push-notification
 * channels, and the on-device local-notification scheduler exposed as
 * `window.PlushLifeNativeNotifications`.
 *
 * This module has no imports and no exports; it runs for its side effects.
 * It is bundled into the app via scripts/sync-www.js (esbuild) and must load
 * before the main app bundle so the back-button handler, notification
 * channels, and `window.PlushLifeNativeNotifications` exist before the UI
 * mounts. (See the "<!-- native bridge -->" note in index.html.)
 *
 * Everything below is a no-op on the web: the whole bridge returns
 * immediately when the Capacitor runtime is not present.
 */
import { cozyReminderCopy } from './cozy-profile.js';
(function () {
  if (!window.Capacitor || !window.Capacitor.Plugins) return;
  var Plugins = window.Capacitor.Plugins;

  if (Plugins.StatusBar) Plugins.StatusBar.setStyle({ style: "DARK" }).catch(function () {});

  if (Plugins.App) {
    var exitArmed = false;
    var exitArmTimer = null;
    var OVERLAY_SELECTOR = '[role="dialog"], [role="alertdialog"], dialog[open]';
    var countOverlays = function () {
      try { return document.querySelectorAll(OVERLAY_SELECTOR).length; }
      catch (_error) { return 0; }
    };
    var showExitToast = function () {
      var toast = document.getElementById("plushlife-exit-toast");
      if (!toast) {
        toast = document.createElement("div");
        toast.id = "plushlife-exit-toast";
        toast.setAttribute("role", "status");
        toast.setAttribute("aria-live", "polite");
        toast.textContent = "Press back again to exit";
        var style = toast.style;
        style.position = "fixed";
        style.left = "50%";
        style.bottom = "32px";
        style.transform = "translateX(-50%)";
        style.background = "rgba(60, 36, 74, 0.94)";
        style.color = "#FFF7FD";
        style.padding = "10px 18px";
        style.borderRadius = "999px";
        style.fontSize = "14px";
        style.fontWeight = "700";
        style.zIndex = "2147483647";
        style.pointerEvents = "none";
        style.boxShadow = "0 6px 24px rgba(60, 36, 74, 0.35)";
        style.transition = "opacity 0.25s ease";
        style.opacity = "0";
        document.body.appendChild(toast);
      }
      toast.style.opacity = "1";
      if (toast.__hideTimer) window.clearTimeout(toast.__hideTimer);
      toast.__hideTimer = window.setTimeout(function () { toast.style.opacity = "0"; }, 1800);
    };
    var armExit = function () {
      exitArmed = true;
      showExitToast();
      if (exitArmTimer) window.clearTimeout(exitArmTimer);
      exitArmTimer = window.setTimeout(function () { exitArmed = false; }, 2000);
    };
    Plugins.App.addListener("backButton", function (state) {
      // Let the app close its own overlays first. If an overlay was open and
      // the Escape key dismissed it, the press is consumed — one press must
      // never dismiss both a modal and the screen underneath it.
      var overlaysBefore = countOverlays();
      if (overlaysBefore > 0) {
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" }));
        if (countOverlays() < overlaysBefore) return;
      }
      if (state && state.canGoBack) {
        window.history.back();
        return;
      }
      if (exitArmed) {
        if (exitArmTimer) window.clearTimeout(exitArmTimer);
        exitArmed = false;
        Plugins.App.exitApp();
        return;
      }
      armExit();
    });
  }

  window.addEventListener("load", function () {
    if (Plugins.SplashScreen) Plugins.SplashScreen.hide().catch(function () {});
  });

  if (Plugins.PushNotifications) {
    Plugins.PushNotifications.createChannel({
      id: "plushlife-care",
      name: "PlushLife care reminders",
      description: "Gentle check-ins and Guardian support chosen in PlushLife",
      importance: 3,
      visibility: 1,
      vibration: true,
    }).catch(function () {});
    Plugins.PushNotifications.addListener("registration", function (token) {
      window.__plushlifeNativePushToken = token && token.value;
      document.dispatchEvent(new CustomEvent("plushlife-native-push-token"));
    });
    Plugins.PushNotifications.addListener("registrationError", function () {});
    Plugins.PushNotifications.addListener("pushNotificationActionPerformed", function (event) {
      var target = event && event.notification && event.notification.data && event.notification.data.url;
      if (typeof target === "string" && /^https:\/\/sablewolphen\.github\.io\/plushlist\/?/.test(target)) window.location.href = target;
    });
  }

  if (Plugins.LocalNotifications) {
    var LocalNotifications = Plugins.LocalNotifications;
    var reminderChannelId = "plushlife-reminders";
    LocalNotifications.createChannel({
      id: reminderChannelId,
      name: "PlushLife reminders",
      description: "Private routine reminders scheduled on this device",
      importance: 3,
      visibility: 1,
      vibration: true,
    }).catch(function () {});
    LocalNotifications.registerActionTypes({
      types: [{
        id: "PLUSHLIFE_REMINDER",
        actions: [
          { id: "DONE", title: "Done" },
          { id: "START", title: "Start · 2 minutes", foreground: true },
          { id: "TINY", title: "Tiny version" },
          { id: "SKIP", title: "Skip today" },
          { id: "SNOOZE_10", title: "10 min" },
          { id: "SNOOZE_30", title: "30 min" },
          { id: "SNOOZE_60", title: "1 hour" },
        ],
      }],
    }).catch(function () {});

    var scheduleLocalReminder = function (details) {
      var at = details.at instanceof Date ? details.at : new Date(details.at);
      if (!Number.isFinite(at.getTime()) || at.getTime() <= Date.now()) return Promise.resolve();
      return LocalNotifications.schedule({ notifications: [{
        id: details.id,
        title: details.title || "A gentle PlushLife reminder",
        body: details.body || "Open PlushLife when you're ready.",
        schedule: { at: at, allowWhileIdle: true },
        channelId: reminderChannelId,
        actionTypeId: "PLUSHLIFE_REMINDER",
        autoCancel: true,
        extra: details.extra || {},
      }] });
    };

    var taskMinutes = function (task) {
      if (!task || !task.time) return null;
      var parts = String(task.time).slice(0, 5).split(":").map(Number);
      if (parts.length !== 2 || parts.some(function (part) { return !Number.isFinite(part); })) return null;
      if (parts[0] < 0 || parts[0] > 23 || parts[1] < 0 || parts[1] > 59) return null;
      return parts[0] * 60 + parts[1];
    };

    var timeBucket = function (minutes) {
      var hour = Math.floor(minutes / 60);
      if (hour >= 5 && hour < 12) return "morning";
      if (hour >= 12 && hour < 15) return "midday";
      if (hour >= 15 && hour < 18) return "afternoon";
      if (hour >= 18 && hour < 22) return "evening";
      return "night";
    };

    var titleForTime = function (at) {
      var bucket = timeBucket(at.getHours() * 60 + at.getMinutes());
      if (bucket === "morning") return "Good morning 🌤️";
      if (bucket === "midday") return "A little midday check-in 💜";
      if (bucket === "afternoon") return "One small win? 🧸";
      if (bucket === "evening") return "Time to wind down 🌙";
      return "One gentle step before rest ✨";
    };

    var taskAppliesToDate = function (task, date) {
      if (!task || task.done || task.completed || task.isDone) return false;
      var dayId = window.PlushLifeCare.DAY_IDS[date.getDay()];
      return !(Array.isArray(task.scheduleDays) && task.scheduleDays.length && !task.scheduleDays.includes(dayId));
    };

    var pickTaskForReminder = function (taskReminders, at) {
      var reminderMinutes = at.getHours() * 60 + at.getMinutes();
      var reminderBucket = timeBucket(reminderMinutes);
      var candidates = (Array.isArray(taskReminders) ? taskReminders : []).map(function (task, index) {
        var minutes = taskMinutes(task);
        if (minutes === null || !taskAppliesToDate(task, at) || !task.label) return null;
        var diff = minutes - reminderMinutes;
        var sameBucket = timeBucket(minutes) === reminderBucket;
        var distance = Math.abs(diff);
        var score = distance;
        if (!sameBucket) score += 180;
        if (diff < -180) score += 240;
        if (diff > 360) score += 180;
        return { task: task, score: score, index: index };
      }).filter(Boolean);
      candidates.sort(function (a, b) { return a.score - b.score || a.index - b.index; });
      if (!candidates.length) return null;
      var winner = candidates[0];
      var winnerMinutes = taskMinutes(winner.task);
      var winnerDistance = Math.abs(winnerMinutes - reminderMinutes);
      if (timeBucket(winnerMinutes) !== reminderBucket && winnerDistance > 180) return null;
      return winner.task;
    };

    var formatMinutes = function (minutes) {
      var safe = ((minutes % 1440) + 1440) % 1440;
      var hour = Math.floor(safe / 60);
      var minute = safe % 60;
      return String(hour).padStart(2, "0") + ":" + String(minute).padStart(2, "0");
    };

    var automaticReminderTimes = function (taskReminders) {
      var groups = { morning: [], daytime: [], evening: [] };
      (Array.isArray(taskReminders) ? taskReminders : []).forEach(function (task) {
        if (!task || task.done || task.completed || task.isDone) return;
        var minutes = taskMinutes(task);
        if (minutes === null) return;
        if (minutes >= 300 && minutes < 720) groups.morning.push(minutes);
        else if (minutes >= 720 && minutes < 1080) groups.daytime.push(minutes);
        else groups.evening.push(minutes);
      });
      var chosen = [];
      [groups.morning, groups.daytime, groups.evening].forEach(function (group) {
        if (!group.length) return;
        group.sort(function (a, b) { return a - b; });
        var middle = group[Math.floor((group.length - 1) / 2)];
        var reminder = Math.floor(Math.max(0, middle - 15) / 15) * 15;
        chosen.push(formatMinutes(reminder));
      });
      return chosen.length ? chosen.slice(0, 3) : ["08:30", "13:00", "19:30"];
    };

    // Quiet hours: never schedule an automatic ping inside the user's
    // quiet-hours window. The app passes its preferences' quiet_start /
    // quiet_end ("HH:MM") as options.quietStart / options.quietEnd; the
    // defaults below match the app's default preferences.
    var DEFAULT_QUIET_START_MINUTES = 21 * 60 + 30;
    var DEFAULT_QUIET_END_MINUTES = 4 * 60 + 30;
    var parseClockMinutes = function (value, fallback) {
      var parts = String(value == null ? "" : value).split(":");
      if (parts.length !== 2) return fallback;
      var hour = Number(parts[0]);
      var minute = Number(parts[1]);
      if (!Number.isFinite(hour) || !Number.isFinite(minute)) return fallback;
      if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return fallback;
      return hour * 60 + minute;
    };

    window.PlushLifeNativeNotifications = {
      syncDailyReminders: async function (options) {
        var pending = await LocalNotifications.getPending();
        var old = (pending.notifications || []).filter(function (item) {
          return item.extra && (item.extra.plushlifeKind === "daily-reminder" || item.extra.plushlifeKind === "task-reminder");
        });
        if (old.length) await LocalNotifications.cancel({ notifications: old.map(function (item) { return { id: item.id }; }) });
        if (!options || !options.enabled) return;
        var quietStartMinutes = parseClockMinutes(options.quietStart, DEFAULT_QUIET_START_MINUTES);
        var quietEndMinutes = parseClockMinutes(options.quietEnd, DEFAULT_QUIET_END_MINUTES);
        var isQuietAt = function (date) {
          var minutes = date.getHours() * 60 + date.getMinutes();
          return quietStartMinutes <= quietEndMinutes
            ? (minutes >= quietStartMinutes && minutes < quietEndMinutes)
            : (minutes >= quietStartMinutes || minutes < quietEndMinutes);
        };
        var taskReminders = Array.isArray(options.taskReminders) ? options.taskReminders : [];
        var suppliedTimes = Array.isArray(options.times) ? options.times.slice(0, 8) : [];
        var legacyDefaults = ["08:00", "12:30", "17:30", "20:30"];
        var isLegacyDefaultSchedule = suppliedTimes.length === legacyDefaults.length && suppliedTimes.every(function (time, index) {
          return String(time).slice(0, 5) === legacyDefaults[index];
        });
        var times = (!suppliedTimes.length || isLegacyDefaultSchedule) ? automaticReminderTimes(taskReminders) : suppliedTimes;
        var restDates = new Set(Array.isArray(options.restDates) ? options.restDates : []);
        var notifications = [];
        var coveredTasks = new Set();
        var duplicateWindowMinutes = 45;

        for (var dayOffset = 0; dayOffset < 7; dayOffset += 1) {
          for (var timeIndex = 0; timeIndex < times.length; timeIndex += 1) {
            var parts = String(times[timeIndex]).split(":").map(Number);
            if (parts.length !== 2 || parts.some(function (part) { return !Number.isFinite(part); })) continue;
            var at = new Date();
            at.setDate(at.getDate() + dayOffset);
            at.setHours(parts[0], parts[1], 0, 0);
            if (at.getTime() <= Date.now()) continue;
            if (isQuietAt(at)) continue;
            var dateKey = window.PlushLifeCare.localDateString(at);
            if (restDates.has(dateKey)) continue;
            var suggestedTask = pickTaskForReminder(taskReminders, at);
            if (suggestedTask && suggestedTask.taskKey) {
              var suggestedMinutes = taskMinutes(suggestedTask);
              var reminderMinutes = at.getHours() * 60 + at.getMinutes();
              if (suggestedMinutes !== null && Math.abs(suggestedMinutes - reminderMinutes) <= duplicateWindowMinutes) {
                coveredTasks.add(dateKey + "::" + suggestedTask.taskKey);
              }
            }
            var cozyCopy = cozyReminderCopy(options.cozyReminderStyle, suggestedTask ? suggestedTask.label : "");
            notifications.push({
              id: window.PlushLifeCare.notificationId("daily-" + dateKey + "-" + timeIndex),
              title: options.discreet ? "A gentle PlushLife reminder" : cozyCopy.title,
              body: options.discreet
                ? "You have something waiting in PlushLife."
                : cozyCopy.body,
              schedule: { at: at, allowWhileIdle: true },
              channelId: reminderChannelId,
              actionTypeId: "PLUSHLIFE_REMINDER",
              autoCancel: true,
              extra: suggestedTask
                ? { plushlifeKind: "daily-reminder", reminderTime: times[timeIndex], taskKey: suggestedTask.taskKey, taskLabel: suggestedTask.label, automaticSchedule: isLegacyDefaultSchedule || !suppliedTimes.length }
                : { plushlifeKind: "daily-reminder", reminderTime: times[timeIndex], automaticSchedule: isLegacyDefaultSchedule || !suppliedTimes.length },
            });
          }

          taskReminders.forEach(function (task) {
            if (!task || !task.time || task.done || task.completed || task.isDone) return;
            var date = new Date();
            date.setDate(date.getDate() + dayOffset);
            var dateKey = window.PlushLifeCare.localDateString(date);
            if (restDates.has(dateKey) || !taskAppliesToDate(task, date)) return;
            if (task.taskKey && coveredTasks.has(dateKey + "::" + task.taskKey)) return;
            var taskAtMinutes = taskMinutes(task);
            if (taskAtMinutes === null) return;
            date.setHours(Math.floor(taskAtMinutes / 60), taskAtMinutes % 60, 0, 0);
            if (date.getTime() <= Date.now()) return;
            if (isQuietAt(date)) return;
            notifications.push({
              id: window.PlushLifeCare.notificationId("task-" + task.taskKey + "-" + dateKey),
              title: options.discreet ? "A gentle PlushLife reminder" : cozyReminderCopy(options.cozyReminderStyle, task.label).title,
              body: options.discreet ? "You have something waiting in PlushLife." : cozyReminderCopy(options.cozyReminderStyle, task.label).body,
              schedule: { at: date, allowWhileIdle: true },
              channelId: reminderChannelId,
              actionTypeId: "PLUSHLIFE_REMINDER",
              autoCancel: true,
              extra: { plushlifeKind: "task-reminder", taskKey: task.taskKey, taskLabel: task.label },
            });
          });
        }
        if (notifications.length) await LocalNotifications.schedule({ notifications: notifications });
      },
      snoozeTask: function (options) {
        var minutes = Math.max(1, Math.min(1440, Number(options && options.minutes) || 10));
        var at = new Date(Date.now() + minutes * 60000);
        return scheduleLocalReminder({
          id: window.PlushLifeCare.notificationId((options && options.taskKey) || "task", at.getTime() % 2147483647),
          title: "Ready for one caring step?",
          body: options && options.label ? options.label : "Your PlushLife task is waiting when you're ready.",
          at: at,
          extra: { plushlifeKind: "task-snooze", taskKey: options && options.taskKey, taskLabel: options && options.label },
        });
      },
    };

    LocalNotifications.addListener("localNotificationActionPerformed", function (event) {
      var minutesByAction = { SNOOZE_10: 10, SNOOZE_30: 30, SNOOZE_60: 60 };
      var minutes = minutesByAction[event && event.actionId];
      var notification = event && event.notification;
      var taskAction = event && ["DONE", "TINY", "SKIP", "START"].includes(event.actionId) ? event.actionId.toLowerCase() : "";
      if (notification) {
        try {
          var storedEvents = JSON.parse(localStorage.getItem("plushlife:notification-events:v1") || "[]");
          storedEvents.push({
            id: String(notification.id || "") + ":" + Date.now(),
            action: minutes ? "snoozed" : "opened",
            actionId: event && event.actionId || "tap",
            taskKey: notification.extra && notification.extra.taskKey || "",
            kind: notification.extra && notification.extra.plushlifeKind || "",
            at: new Date().toISOString()
          });
          localStorage.setItem("plushlife:notification-events:v1", JSON.stringify(storedEvents.slice(-120)));
          window.dispatchEvent(new CustomEvent("plushlife:notification-interaction"));
        } catch (_error) {}
      }
      if (taskAction && notification && notification.extra && notification.extra.taskKey) {
        try {
          localStorage.setItem("plushlife:pending-notification-action:v1", JSON.stringify({ action: taskAction, taskKey: notification.extra.taskKey, at: new Date().toISOString() }));
          document.dispatchEvent(new CustomEvent("plushlife-notification-task-action"));
        } catch (_error) {}
      }
      if (minutes && notification) {
        scheduleLocalReminder({
          id: window.PlushLifeCare.notificationId("action-snooze", Date.now() % 2147483647),
          title: notification.title,
          body: notification.body,
          at: new Date(Date.now() + minutes * 60000),
          extra: notification.extra || {},
        }).catch(function () {});
        document.dispatchEvent(new CustomEvent("plushlife-notification-snoozed", { detail: { minutes: minutes } }));
      }
    });
  }
})();
