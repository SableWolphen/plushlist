(function () {
  let hint = {};
  try { hint = JSON.parse(localStorage.getItem("plushlife-login-theme") || "{}"); } catch (_error) {}
  const worlds = window.PlushLifeThemeCopy?.worlds || {};
  const world = worlds[hint.world] ? hint.world : "soft";
  let savedMode;
  try { savedMode = localStorage.getItem("plushlife:appearance-mode:v1"); } catch (_error) {}
  const dark = savedMode === "dark";
  const paletteWorld = world;
  const baseTheme = worlds[world];
  if (!baseTheme) return;
  const darkTheme = {
    background: "#211F27",
    surface: "#2D2933",
    surface2: "#3A3442",
    ink: "#F8F2FB",
    muted: "#C5BACD",
    accent: baseTheme.accent,
    line: "#4A4252",
  };
  const theme = dark ? { ...baseTheme, ...darkTheme } : baseTheme;
  const names = { background: "bg", surface: "surface", surface2: "surface-2", ink: "ink", muted: "muted", accent: "accent", line: "line" };
  for (const [key, name] of Object.entries(names)) document.body.style.setProperty(`--pl-theme-${name}`, theme[key]);
  document.body.style.setProperty("--pl-theme-on-accent", dark ? "#211F27" : "#FFFFFF");
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  if (document.body.classList.contains("pl-supporting-page")) document.body.dataset.supportingWorld = world;
  else if (document.querySelector(".auth-card")) document.body.dataset.loginWorld = world;
  else document.body.dataset.landingWorld = world;
  const image = document.querySelector(".pl-login-scene img");
  if (image) { image.src = `./assets/figma/${worlds[world].asset}.svg`; image.width = world === "dino" || world.startsWith("baby") ? 294 : 211; image.height = 100; image.alt = "Your lavender plush companion"; }
  const copy = window.PlushLifeThemeCopy.forWorld(world, hint.voice);
  for (const selector of [".brand h1", ".auth-subtitle"]) { const node = document.querySelector(selector); if (node && copy[node.textContent]) node.textContent = copy[node.textContent]; }
})();
