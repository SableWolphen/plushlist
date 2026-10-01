// Current-app Figma worlds. Every world uses the same signature lavender bear.
export const ThemeWorldContext = React.createContext({ world: "soft", voice: "motherly" });
export const FIGMA_WORLDS = window.PlushLifeThemeCopy.worlds;

import { wardrobeGeometry, REAR_OUTFITS, FRONT_OUTFITS } from "../mascot-wardrobe.js";

export function ThemeScene({ world, className = "", decorative = false, outfit, focus = false, mood = "neutral" }) {
  const context = React.useContext(ThemeWorldContext);
  const inherited = typeof context === "string" ? context : context.world;
  const requested = world === "warm" || String(world).startsWith("baby_") ? inherited : world || inherited;
  const selected = FIGMA_WORLDS[requested] ? requested : "soft";
  outfit = outfit || context.outfit;
  const geometry = wardrobeGeometry(selected);
  const layer = (position) => <svg className={`pl-outfit-layer pl-outfit-${position}`} width={geometry.width} height="100" viewBox={`0 0 ${geometry.width} 100`} aria-hidden="true"><g transform={`translate(${geometry.x} ${geometry.y}) scale(${geometry.scale})`}><use href={`./assets/plush-outfits.svg#${outfit.id}-${position}`} width="100" height="100" /></g></svg>;
  return <span className={`pl-theme-scene ${className} ${focus ? "pl-mascot-focus" : ""}`} data-world={selected} aria-hidden={decorative || undefined}>
    <span className="pl-scene-art" style={focus ? { width: `${geometry.width / geometry.scale / 120 * 100}%`, left: `${(10 - geometry.x / geometry.scale) / 120 * 100}%`, top: `${(5 - geometry.y / geometry.scale) / 110 * 100}%`, aspectRatio: `${geometry.width} / 100` } : { width: geometry.width, aspectRatio: `${geometry.width} / 100` }}>
      {outfit && REAR_OUTFITS.has(outfit.id) && layer("back")}
      <img src={`./assets/figma/${FIGMA_WORLDS[selected].asset}${["happy", "excited"].includes(mood) ? "-happy" : ""}.svg`} alt={decorative ? "" : `Your cozy plush${outfit ? ` wearing ${outfit.name}` : ""}${["happy", "excited"].includes(mood) ? ", cheering for you" : ""}`} width={geometry.width} height="100" decoding="async" />
      {outfit && FRONT_OUTFITS.has(outfit.id) && layer("front")}
    </span>
  </span>;
}

export function DesignIcon({ name, className = "" }) {
  return <span className={`pl-design-icon ${className}`} aria-hidden="true" style={{ maskImage: `url(./assets/figma/icon-${name}.svg)`, WebkitMaskImage: `url(./assets/figma/icon-${name}.svg)` }} />;
}

export function CozyScene({ title, subtitle, world, outfit, focus = false }) {
  const copy = useThemeCopy();
  title = copy[title] || title;
  subtitle = copy[subtitle] || subtitle;
  return <section className="pl-cozy-scene"><span className="pl-scene-owner"><ThemeScene world={world} outfit={outfit} focus={focus} decorative /></span><div className="pl-companion-copy"><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div></section>;
}

export function useThemeCopy() {
  const context = React.useContext(ThemeWorldContext);
  const world = typeof context === "string" ? context : context.world;
  return window.PlushLifeThemeCopy?.forWorld(world, context.voice) || {};
}
