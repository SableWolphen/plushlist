(function () {
  let hint = {};
  try { hint = JSON.parse(localStorage.getItem("plushlife-login-theme") || "{}"); } catch (_error) {}
  const worlds = window.PlushLifeThemeCopy?.worlds || {};
  const world = worlds[hint.world] ? hint.world : "soft";
  let savedMode;
  try { savedMode = localStorage.getItem("plushlife:appearance-mode:v1"); } catch (_error) {}
  const dark = savedMode === "dark";
  const paletteWorld = dark ? (world.startsWith("baby") ? "baby-night" : "twilight") : world;
  const theme = worlds[paletteWorld];
  if (!theme) return;
  const names = { background: "bg", surface: "surface", surface2: "surface-2", ink: "ink", muted: "muted", accent: "accent", line: "line" };
  for (const [key, name] of Object.entries(names)) document.body.style.setProperty(`--pl-theme-${name}`, theme[key]);
  document.body.style.setProperty("--pl-theme-on-accent", ["twilight", "baby-night"].includes(paletteWorld) ? "#29223E" : "#FFFFFF");
  document.documentElement.style.colorScheme = dark || ["twilight", "baby-night"].includes(paletteWorld) ? "dark" : "light";
  if (document.body.classList.contains("pl-supporting-page")) document.body.dataset.supportingWorld = world;
  else if (document.querySelector(".auth-card")) document.body.dataset.loginWorld = world;
  else document.body.dataset.landingWorld = world;
  const image = document.querySelector(".pl-login-scene img");
  if (image) { image.src = `./assets/figma/${worlds[world].asset}.svg`; image.width = world === "dino" || world.startsWith("baby") ? 294 : 211; image.height = 100; image.alt = "Your lavender plush companion"; }
  const copy = window.PlushLifeThemeCopy.forWorld(world, hint.voice);
  for (const selector of [".brand h1", ".auth-subtitle"]) { const node = document.querySelector(selector); if (node && copy[node.textContent]) node.textContent = copy[node.textContent]; }
})();
