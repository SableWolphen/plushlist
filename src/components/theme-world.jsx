// Current-app Figma worlds. Every world uses the same signature lavender bear.
export const ThemeWorldContext = React.createContext({ world: "soft", voice: "motherly" });
export const FIGMA_WORLDS = window.PlushLifeThemeCopy.worlds;

export function ThemeScene({ world, className = "", decorative = false }) {
  const context = React.useContext(ThemeWorldContext);
  const inherited = typeof context === "string" ? context : context.world;
  const requested = world === "warm" || String(world).startsWith("baby_") ? inherited : world || inherited;
  const selected = FIGMA_WORLDS[requested] ? requested : "soft";
  return <span className={`pl-theme-scene ${className}`} data-world={selected} aria-hidden={decorative || undefined}>
    <img src={`./assets/figma/${FIGMA_WORLDS[selected].asset}.svg`} alt={decorative ? "" : `Your ${FIGMA_WORLDS[selected].companion}`} width={selected === "dino" || selected.startsWith("baby") ? 294 : 211} height="100" decoding="async" />
  </span>;
}

export function DesignIcon({ name, className = "" }) {
  return <span className={`pl-design-icon ${className}`} aria-hidden="true" style={{ maskImage: `url(./assets/figma/icon-${name}.svg)`, WebkitMaskImage: `url(./assets/figma/icon-${name}.svg)` }} />;
}

export function CozyScene({ title, subtitle, world, accessory }) {
  const copy = useThemeCopy();
  title = copy[title] || title;
  subtitle = copy[subtitle] || subtitle;
  return <section className="pl-cozy-scene"><span className="pl-scene-owner"><ThemeScene world={world} decorative />{accessory && <span className="pl-scene-accessory" aria-hidden="true">{accessory}</span>}</span><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</section>;
}

export function useThemeCopy() {
  const context = React.useContext(ThemeWorldContext);
  const world = typeof context === "string" ? context : context.world;
  return window.PlushLifeThemeCopy?.forWorld(world, context.voice) || {};
}
