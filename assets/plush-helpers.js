(function (root, factory) {
  const plushContent = typeof module === "object" && module.exports
    ? require("./plush-content.js")
    : (root && root.PlushLifeContent) || {};
  const api = factory(plushContent);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.PlushLifeHelpers = api;
})(typeof window !== "undefined" ? window : globalThis, function (plushContent) {
  // Small pure helpers with no JSX and no dependency on component state,
  // moved out of the main app-source script alongside assets/plush-content.js
  // (module split phase 2 — see docs/module-split-plan.md).

  const MOTHERLY_NICKNAMES = ["baby", "little one", "sweetheart", "angel", "bunny", "pumpkin", "darling"];
  const OPTIONAL_SECTION_MARKERS = ["bonus", "little space", "reward", "fun"];

  function formatRelativeTime(isoString) {
    if (!isoString) return "Never yet";
    const diffMs = Date.now() - new Date(isoString).getTime();
    const minutes = Math.floor(diffMs / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} ${days === 1 ? "day" : "days"} ago`;
    return new Date(isoString).toLocaleDateString();
  }

  function urlBase64ToUint8Array(value) {
    const padding = "=".repeat((4 - value.length % 4) % 4);
    const base64 = (value + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(base64);
    return Uint8Array.from([...raw].map((character) => character.charCodeAt(0)));
  }

  function mascotGrowthStageForDays(activityDays) {
    const stages = plushContent.MASCOT_GROWTH_STAGES;
    return stages.find((stage) => activityDays >= stage.minDays) || stages[stages.length - 1];
  }

  return {
    MOTHERLY_NICKNAMES,
    OPTIONAL_SECTION_MARKERS,
    formatRelativeTime,
    urlBase64ToUint8Array,
    mascotGrowthStageForDays,
  };
});
