// Approved Figma worlds. Stable preference IDs keep existing accounts intact.
export const ThemeWorldContext = React.createContext("soft");

export const FIGMA_WORLDS = {
  soft: { label: "Lavender", background: "#F6F1FB", surface: "#FFFFFF", ink: "#493556", muted: "#786486", accent: "#7860A8", surface2: "#E9DDF6", companion: "lavender bear" },
  dino: { label: "Dino", background: "#F2F5ED", surface: "#FFFFFB", ink: "#374B42", muted: "#65766B", accent: "#587C65", surface2: "#E1EDDB", companion: "lavender dinosaur" },
  baby: { label: "Baby", background: "#FFF4ED", surface: "#FFFDFA", ink: "#65464F", muted: "#8B6C73", accent: "#A8677F", surface2: "#F5DFE7", companion: "nursery teddy" },
  pink: { label: "Pink", background: "#FFF1F6", surface: "#FFFCFE", ink: "#633E53", muted: "#936A80", accent: "#A85680", surface2: "#F6DCE9", companion: "blossom bunny" },
  meadow: { label: "Mint", background: "#EEF7F0", surface: "#FBFFFC", ink: "#34534A", muted: "#617C70", accent: "#4F806C", surface2: "#DCEFE2", companion: "pond frog" },
  peach: { label: "Peach", background: "#FFF3E8", surface: "#FFFDFA", ink: "#65483E", muted: "#927063", accent: "#AD704E", surface2: "#F5E0C8", companion: "orchard fox" },
  twilight: { label: "Night", background: "#211F39", surface: "#302C49", ink: "#F4ECFF", muted: "#BEB1D3", accent: "#C6ACEF", surface2: "#403657", companion: "sleepy owl" },
  strawberry: { label: "Strawberry", background: "#FFF3F1", surface: "#FFFDF9", ink: "#684047", muted: "#947079", accent: "#AF5A6C", surface2: "#F5DCDD", companion: "berry hedgehog" },
  "soft-light": { label: "Cloud", background: "#EFF6FC", surface: "#FCFEFF", ink: "#3E536B", muted: "#6B8099", accent: "#5E83AC", surface2: "#DEEBF7", companion: "cloud pup" },
  "baby-night": { label: "Baby Night", background: "#211F39", surface: "#302C49", ink: "#F4ECFF", muted: "#BEB1D3", accent: "#C6ACEF", surface2: "#403657", companion: "sleepy nursery teddy" },
};

export function ThemeScene({ world, className = "", decorative = false }) {
  const inherited = React.useContext(ThemeWorldContext);
  const selected = FIGMA_WORLDS[world || inherited] ? (world || inherited) : "soft";
  return <span className={`pl-theme-scene ${className}`} data-world={selected} aria-hidden={decorative || undefined}>
    <img src={`./assets/figma/${selected}.svg`} alt={decorative ? "" : `Your ${FIGMA_WORLDS[selected].companion}`} width="211" height="100" decoding="async" />
  </span>;
}

export function DesignIcon({ name, className = "" }) {
  return <span className={`pl-design-icon ${className}`} aria-hidden="true" style={{ maskImage: `url(./assets/figma/icon-${name}.svg)`, WebkitMaskImage: `url(./assets/figma/icon-${name}.svg)` }} />;
}

export function CozyScene({ title, subtitle, world }) {
  return <section className="pl-cozy-scene"><ThemeScene world={world} decorative /><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</section>;
}
