export function DesignIcon({ name, className = "" }) {
  return <span className={`pl-design-icon ${className}`} aria-hidden="true" style={{ maskImage: `url(./assets/figma/icon-${name}.svg)`, WebkitMaskImage: `url(./assets/figma/icon-${name}.svg)` }} />;
}
