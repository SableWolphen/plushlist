(function () {
  let hint = {};
  try { hint = JSON.parse(localStorage.getItem("plushlife-login-theme") || "{}"); } catch (_error) {}
  const worlds = window.PlushLifeThemeCopy?.worlds || {};
  const world = worlds[hint.world] ? hint.world : "soft";
  const theme = worlds[world];
  if (!theme) return;
  const names = { background: "bg", surface: "surface", surface2: "surface-2", ink: "ink", muted: "muted", accent: "accent", line: "line" };
  for (const [key, name] of Object.entries(names)) document.body.style.setProperty(`--pl-theme-${name}`, theme[key]);
  document.body.style.setProperty("--pl-theme-on-accent", ["twilight", "baby-night"].includes(world) ? "#29223E" : "#FFFFFF");
  document.body.dataset.loginWorld = world;
  const image = document.querySelector(".pl-login-scene img");
  if (image) { image.src = `./assets/figma/${theme.asset}.svg`; image.width = world === "dino" || world.startsWith("baby") ? 294 : 211; image.height = 100; image.alt = "Your lavender plush companion"; }
  const copy = window.PlushLifeThemeCopy.forWorld(world, hint.voice);
  for (const selector of [".brand h1", ".auth-subtitle"]) { const node = document.querySelector(selector); if (node) node.textContent = copy[node.textContent] || node.textContent; }
})();
