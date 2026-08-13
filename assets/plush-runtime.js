(function () {
  "use strict";

  if (window.PlushLifeRuntime) return;

  var METRICS_KEY = "plushlife_runtime_metrics_v1";
  var ERRORS_KEY = "plushlife_runtime_errors_v1";
  var MAX_METRICS = 40;
  var MAX_ERRORS = 20;
  var longTaskCount = 0;
  var longTaskDuration = 0;
  var firstContentfulPaint = null;
  var lazyStarts = Object.create(null);
  var PREFETCH_DELAY_MS = 8000;
  var PREFETCH_LIMIT = 2;

  function now() {
    return Math.round((performance && performance.now ? performance.now() : Date.now()) * 10) / 10;
  }

  function safeRead(key) {
    try {
      var value = localStorage.getItem(key);
      return value ? JSON.parse(value) : [];
    } catch (_error) {
      return [];
    }
  }

  function safeWrite(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (_error) {}
  }

  function pushRing(key, value, limit) {
    var items = safeRead(key);
    if (!Array.isArray(items)) items = [];
    items.push(value);
    if (items.length > limit) items = items.slice(items.length - limit);
    safeWrite(key, items);
  }

  function sanitizeText(value) {
    return String(value || "")
      .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[email]")
      .replace(/https?:\/\/[^\s)]+/gi, "[url]")
      .replace(/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/gi, "[id]")
      .slice(0, 180);
  }

  function relativeSource(source) {
    try {
      if (!source) return "";
      var url = new URL(source, location.href);
      return url.origin === location.origin ? url.pathname.split("/").slice(-2).join("/") : "external";
    } catch (_error) {
      return "";
    }
  }

  function recordMetric(name, value, detail) {
    var entry = {
      name: String(name),
      value: Math.round(Number(value || 0) * 10) / 10,
      at: Date.now(),
    };
    if (detail) entry.detail = detail;
    pushRing(METRICS_KEY, entry, MAX_METRICS);
    try {
      document.dispatchEvent(new CustomEvent("plushlife-performance", { detail: entry }));
    } catch (_error) {}
    return entry;
  }

  function recordError(kind, message, source, line, column) {
    var entry = {
      kind: String(kind || "error"),
      message: sanitizeText(message),
      source: relativeSource(source),
      line: Number(line || 0),
      column: Number(column || 0),
      at: Date.now(),
    };
    pushRing(ERRORS_KEY, entry, MAX_ERRORS);
    return entry;
  }

  function mark(name) {
    if (!performance || typeof performance.mark !== "function") return;
    try { performance.mark("plushlife:" + name); } catch (_error) {}
  }

  function measure(name, startName, endName) {
    if (!performance || typeof performance.measure !== "function") return null;
    try {
      var entry = performance.measure(
        "plushlife:" + name,
        startName ? "plushlife:" + startName : undefined,
        endName ? "plushlife:" + endName : undefined
      );
      recordMetric(name, entry.duration);
      return entry.duration;
    } catch (_error) {
      return null;
    }
  }

  function connectionAllowsPrefetch() {
    var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (!connection) return true;
    if (connection.saveData) return false;
    return !/^(slow-)?2g$/i.test(connection.effectiveType || "");
  }

  function addModulePreload(href) {
    if (!href || document.querySelector('link[data-plush-prefetch="' + href.replace(/"/g, "") + '"]')) return;
    var link = document.createElement("link");
    link.rel = "modulepreload";
    link.href = href;
    link.setAttribute("data-plush-prefetch", href);
    document.head.appendChild(link);
  }

  function prefetchLikelyPanels() {
    if (!connectionAllowsPrefetch() || document.visibilityState === "hidden") return Promise.resolve([]);
    return fetch("./assets/prefetch-manifest.json", { cache: "force-cache" })
      .then(function (response) { return response.ok ? response.json() : []; })
      .then(function (files) {
        if (!Array.isArray(files)) return [];
        files.slice(0, PREFETCH_LIMIT).forEach(addModulePreload);
        recordMetric("idle-prefetch-count", Math.min(files.length, PREFETCH_LIMIT));
        return files;
      })
      .catch(function () { return []; });
  }

  function scheduleIdlePrefetch() {
    var run = function () {
      if (document.visibilityState === "hidden") return;
      if (typeof requestIdleCallback === "function") {
        requestIdleCallback(function () { prefetchLikelyPanels(); }, { timeout: 5000 });
      } else {
        prefetchLikelyPanels();
      }
    };
    setTimeout(run, PREFETCH_DELAY_MS);
  }

  function haptic(kind) {
    if (!window.Capacitor || typeof navigator.vibrate !== "function") return false;
    var pattern = kind === "success" ? [10, 30, 16] : kind === "soft" ? 8 : 12;
    try { return navigator.vibrate(pattern); } catch (_error) { return false; }
  }

  function installCompletionHaptics() {
    document.addEventListener("click", function (event) {
      var button = event.target && event.target.closest ? event.target.closest("button") : null;
      if (!button || button.disabled) return;
      var label = (button.getAttribute("aria-label") || button.textContent || "").trim();
      if (/^(✓\s*)?(done|did the smaller version)/i.test(label) || /mark .* complete/i.test(label)) haptic("success");
    }, true);
  }

  function installPolishStyles() {
    if (document.getElementById("plush-runtime-polish")) return;
    var style = document.createElement("style");
    style.id = "plush-runtime-polish";
    style.textContent = "@keyframes plushSkeletonPulse{0%,100%{opacity:.52}50%{opacity:1}}" +
      ".plush-lazy-skeleton{position:relative;margin:10px 0 16px;padding:18px;border-radius:16px;border:1px solid #eadcf2;background:rgba(255,255,255,.72);overflow:hidden}" +
      ".plush-lazy-skeleton__title,.plush-lazy-skeleton__line{height:12px;border-radius:999px;background:linear-gradient(90deg,#eadcf2,#f7effb,#eadcf2);animation:plushSkeletonPulse 1.15s ease-in-out infinite}" +
      ".plush-lazy-skeleton__title{width:42%;height:16px}.plush-lazy-skeleton__line{margin-top:11px;width:88%}.plush-lazy-skeleton__line--short{width:64%}" +
      ".plush-lazy-skeleton__label{display:block;margin-top:12px;font-size:11px;font-weight:800;color:#8c6b9e}" +
      "@media(prefers-reduced-motion:reduce){.plush-lazy-skeleton__title,.plush-lazy-skeleton__line{animation:none}}";
    document.head.appendChild(style);
  }

  function installFirstRenderMetric() {
    var root = document.getElementById("root");
    if (!root) return;
    var recorded = false;
    var check = function () {
      if (recorded || !root.firstElementChild || root.firstElementChild.id === "plush-boot-shell") return;
      recorded = true;
      recordMetric("first-app-render", now());
    };
    check();
    if (recorded || typeof MutationObserver !== "function") return;
    var observer = new MutationObserver(function () {
      check();
      if (recorded) observer.disconnect();
    });
    observer.observe(root, { childList: true, subtree: true });
  }

  function installFirstInteractionMetric() {
    var recorded = false;
    var record = function (event) {
      if (recorded) return;
      var target = event.target;
      if (target && target.closest && target.closest("#plush-boot-shell")) return;
      recorded = true;
      recordMetric("first-user-interaction", now(), event.type);
      document.removeEventListener("pointerdown", record, true);
      document.removeEventListener("keydown", record, true);
    };
    document.addEventListener("pointerdown", record, true);
    document.addEventListener("keydown", record, true);
  }

  function installLazyPanelMetrics() {
    if (typeof MutationObserver !== "function") return;
    var observer = new MutationObserver(function (mutations) {
      mutations.forEach(function (mutation) {
        Array.prototype.forEach.call(mutation.addedNodes || [], function (node) {
          if (!node || node.nodeType !== 1) return;
          var skeleton = node.matches && node.matches(".plush-lazy-skeleton") ? node : node.querySelector && node.querySelector(".plush-lazy-skeleton");
          if (!skeleton) return;
          var panel = skeleton.getAttribute("data-panel") || "panel";
          lazyStarts[panel] = now();
        });
        Array.prototype.forEach.call(mutation.removedNodes || [], function (node) {
          if (!node || node.nodeType !== 1) return;
          var skeleton = node.matches && node.matches(".plush-lazy-skeleton") ? node : node.querySelector && node.querySelector(".plush-lazy-skeleton");
          if (!skeleton) return;
          var panel = skeleton.getAttribute("data-panel") || "panel";
          if (lazyStarts[panel] == null) return;
          recordMetric("lazy-panel-open", now() - lazyStarts[panel], panel);
          delete lazyStarts[panel];
        });
      });
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  function installObservers() {
    if (typeof PerformanceObserver !== "function") return;
    try {
      var paintObserver = new PerformanceObserver(function (list) {
        list.getEntries().forEach(function (entry) {
          if (entry.name === "first-contentful-paint" && firstContentfulPaint == null) {
            firstContentfulPaint = entry.startTime;
            recordMetric("first-contentful-paint", entry.startTime);
          }
        });
      });
      paintObserver.observe({ type: "paint", buffered: true });
    } catch (_error) {}

    try {
      var longTaskObserver = new PerformanceObserver(function (list) {
        list.getEntries().forEach(function (entry) {
          longTaskCount += 1;
          longTaskDuration += entry.duration;
        });
      });
      longTaskObserver.observe({ type: "longtask", buffered: true });
    } catch (_error) {}
  }

  function recordNavigationMetrics() {
    var nav = performance && performance.getEntriesByType ? performance.getEntriesByType("navigation")[0] : null;
    if (nav) {
      recordMetric("response-start", nav.responseStart);
      recordMetric("dom-content-loaded", nav.domContentLoadedEventEnd);
      recordMetric("window-load", nav.loadEventEnd || now());
    }
    if (longTaskCount) {
      recordMetric("long-task-count", longTaskCount);
      recordMetric("long-task-total", longTaskDuration);
    }
  }

  window.addEventListener("error", function (event) {
    recordError("error", event.message, event.filename, event.lineno, event.colno);
  });
  window.addEventListener("unhandledrejection", function (event) {
    var reason = event.reason;
    recordError("promise", reason && reason.message ? reason.message : reason, "", 0, 0);
  });

  window.PlushLifeRuntime = {
    mark: mark,
    measure: measure,
    metric: recordMetric,
    haptic: haptic,
    prefetchLikelyPanels: prefetchLikelyPanels,
    metrics: function () { return safeRead(METRICS_KEY); },
    errors: function () { return safeRead(ERRORS_KEY); },
    clearDiagnostics: function () {
      try {
        localStorage.removeItem(METRICS_KEY);
        localStorage.removeItem(ERRORS_KEY);
      } catch (_error) {}
    },
  };

  mark("runtime-ready");
  if (document.getElementById("plush-boot-shell")) recordMetric("boot-shell-ready", now());
  installPolishStyles();
  installObservers();
  installFirstRenderMetric();
  installFirstInteractionMetric();
  installLazyPanelMetrics();
  installCompletionHaptics();

  if (document.readyState === "complete") {
    recordNavigationMetrics();
    scheduleIdlePrefetch();
  } else {
    window.addEventListener("load", function () {
      recordNavigationMetrics();
      scheduleIdlePrefetch();
    }, { once: true });
  }
})();
