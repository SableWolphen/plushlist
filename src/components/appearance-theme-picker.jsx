import { PlushMascot } from "./mascot.jsx";

const secondaryButton = {
  padding: "9px 12px",
  borderRadius: 13,
  border: "1px solid var(--pl-theme-line,#E9DDF6)",
  background: "var(--pl-theme-surface)",
  color: "var(--pl-theme-ink,#755D82)",
  fontWeight: 800,
  cursor: "pointer",
};

function BabyModeExplainer() {
  const [dismissed, setDismissed] = React.useState(() => {
    try {
      return window.localStorage.getItem("plushlife:baby-mode:explainer-seen:v1") === "1";
    } catch (_error) {
      return true;
    }
  });
  if (dismissed) return null;
  const dismiss = () => {
    try {
      window.localStorage.setItem("plushlife:baby-mode:explainer-seen:v1", "1");
    } catch (_error) {}
    setDismissed(true);
  };
  return (
    <div style={{ marginTop: 8, padding: "10px 12px", borderRadius: 12, background: "var(--pl-theme-surface,#FDF6FF)", border: "1px solid var(--pl-theme-line,#E9DDF6)", fontSize: 11.5, lineHeight: 1.5, color: "var(--pl-theme-ink,#6B5A7D)" }}>
      <strong style={{ color: "var(--pl-theme-ink,#5B3D70)" }}>What is Nursery?</strong> Nursery is a simplified comfort view: bigger words, rounder controls, and candy-soft decoration on the Home screen. Your tasks and progress do not change — everything is still there when you switch back.
      <button type="button" onClick={dismiss} style={{ marginTop: 6, display: "block", minHeight: 32, padding: "4px 10px", borderRadius: 8, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface)", color: "var(--pl-theme-ink)", fontWeight: 900, fontSize: 11, cursor: "pointer" }}>Got it</button>
    </div>
  );
}

export function AppearanceThemePicker({ preferences, appearanceTheme, selectAppearanceTheme, dinoTheme, updatePreference }) {
  const { APPEARANCE_THEMES } = window.PlushLifeContent;
  return (
    <>
      <div style={{ fontSize: 11.5, fontWeight: 900, color: "var(--pl-theme-ink,#745D81)" }}>APPEARANCE</div>
      <div role="group" aria-label="Choose light or dark appearance" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginTop: 7, marginBottom: 13, padding: 4, borderRadius: 14, background: "var(--pl-theme-surface-2)", border: "1px solid var(--pl-theme-line)" }}>
        <button type="button" aria-pressed={!preferences.dark_mode} onClick={() => updatePreference({ dark_mode: false })} style={{ minHeight: 44, borderRadius: 11, border: !preferences.dark_mode ? "2px solid var(--pl-theme-accent)" : "1px solid transparent", background: !preferences.dark_mode ? "var(--pl-theme-surface)" : "transparent", color: "var(--pl-theme-ink)", fontWeight: 900, cursor: "pointer" }}>☀️ Light</button>
        <button type="button" aria-pressed={!!preferences.dark_mode} onClick={() => updatePreference({ dark_mode: true })} style={{ minHeight: 44, borderRadius: 11, border: preferences.dark_mode ? "2px solid var(--pl-theme-accent)" : "1px solid transparent", background: preferences.dark_mode ? "var(--pl-theme-surface)" : "transparent", color: "var(--pl-theme-ink)", fontWeight: 900, cursor: "pointer" }}>🌙 Dark</button>
      </div>
      <div style={{ fontSize: 11.5, lineHeight: 1.45, color: "var(--pl-theme-muted,#8A7895)", marginBottom: 12 }}>Light or dark changes the palette, not your chosen world. Lavender stays Lavender, Dino stays Dino, and so on.</div>
      <div style={{ fontSize: 11.5, fontWeight: 900, color: "var(--pl-theme-ink,#745D81)" }}>AMBIENT THEME</div>
      <div style={{ marginTop: 4, fontSize: 11.5, lineHeight: 1.45, color: "var(--pl-theme-muted,#8A7895)" }}>Swipe to choose your world. Your routines and progress stay with you.</div>
      <div className="pl-theme-picker" aria-label="Choose your theme">
        <button type="button" onClick={() => selectAppearanceTheme("none")} aria-pressed={!dinoTheme && preferences.nickname_style !== "baby" && appearanceTheme === "none"} style={{ position: "relative", overflow: "hidden", minHeight: 102, padding: 0, borderRadius: 16, border: !dinoTheme && preferences.nickname_style !== "baby" && appearanceTheme === "none" ? "2px solid var(--pl-theme-ink)" : "1px solid var(--pl-theme-line)", background: "var(--pl-theme-surface)", color: "var(--pl-theme-ink)", fontWeight: 900, cursor: "pointer", boxShadow: !dinoTheme && preferences.nickname_style !== "baby" && appearanceTheme === "none" ? "0 7px 18px color-mix(in srgb,var(--pl-theme-ink) 16%,transparent)" : "0 4px 12px rgba(96,62,108,.05)" }}>
          <span aria-hidden="true" style={{ display: "grid", placeItems: "center", minHeight: 69, background: "linear-gradient(145deg,var(--pl-theme-surface),var(--pl-theme-surface-2))", fontSize: 28 }}>♡</span>
          <span style={{ display: "block", padding: "6px 4px 8px", background: "var(--pl-theme-surface-2)", color: "var(--pl-theme-ink)", borderTop: "1px solid var(--pl-theme-line)", fontSize: 12 }}>No theme{!dinoTheme && preferences.nickname_style !== "baby" && appearanceTheme === "none" ? " ✓" : ""}</span>
        </button>
        <button type="button" onClick={() => updatePreference({ dino_theme: true, nickname_style: "warm" })} aria-pressed={!!dinoTheme} style={{ position: "relative", overflow: "hidden", minHeight: 102, padding: 0, borderRadius: 16, border: dinoTheme ? "2px solid #9B67C6" : "1px solid #E4D8E8", background: "var(--pl-theme-surface)", color: "var(--pl-theme-ink,#5D3F73)", fontWeight: 900, cursor: "pointer", boxShadow: dinoTheme ? "0 7px 18px rgba(155,103,198,.22)" : "0 4px 12px rgba(96,62,108,.05)" }}>
          <span aria-hidden="true" style={{ display: "grid", placeItems: "center", minHeight: 69, background: "radial-gradient(circle at 30% 30%,#FFF6D5,transparent 42%),linear-gradient(145deg,#EFE5FF,#E8F6ED)" }}><PlushMascot theme="dino" size={104} /></span>
          <span style={{ display: "block", padding: "6px 4px 8px", background: "var(--pl-theme-surface-2)", color: "var(--pl-theme-ink)", borderTop: "1px solid var(--pl-theme-line)", fontSize: 12 }}>Dino{dinoTheme ? " ✓" : ""}</span>
        </button>
        <button type="button" onClick={() => updatePreference({ nickname_style: "baby", dino_theme: false })} aria-pressed={preferences.nickname_style === "baby"} style={{ position: "relative", overflow: "hidden", minHeight: 102, padding: 0, borderRadius: 16, border: preferences.nickname_style === "baby" ? "2px solid #E572B7" : "1px solid #E4D8E8", background: "var(--pl-theme-surface)", color: "var(--pl-theme-ink,#743B6D)", fontWeight: 900, cursor: "pointer", boxShadow: preferences.nickname_style === "baby" ? "0 7px 18px rgba(229,114,183,.20)" : "0 4px 12px rgba(96,62,108,.05)" }}>
          <span aria-hidden="true" style={{ display: "grid", placeItems: "center", minHeight: 69, background: "radial-gradient(circle at 72% 26%,#FFF4B8,transparent 34%),linear-gradient(145deg,#FFF0F7,#F1E9FF)" }}><PlushMascot theme="baby" size={104} /></span>
          <span style={{ display: "block", padding: "6px 4px 8px", background: "var(--pl-theme-surface-2)", color: "var(--pl-theme-ink)", borderTop: "1px solid var(--pl-theme-line)", fontSize: 12 }}>Nursery{preferences.nickname_style === "baby" ? " ✓" : ""}</span>
        </button>
        {APPEARANCE_THEMES.map((theme) => {
          const selected = !dinoTheme && preferences.nickname_style !== "baby" && appearanceTheme === theme.id;
          return <button key={theme.id} type="button" onClick={() => selectAppearanceTheme(theme.id)} aria-pressed={selected} style={{ position: "relative", overflow: "hidden", padding: 0, minHeight: 102, borderRadius: 16, border: selected ? `2px solid ${theme.accent}` : "1px solid #E4D8E8", background: theme.background, color: theme.ink || "#695474", fontWeight: 900, cursor: "pointer", boxShadow: selected ? `0 7px 18px ${theme.accent}33` : "0 4px 12px rgba(96,62,108,.05)" }}>
            <span aria-hidden="true" style={{ position: "absolute", inset: 0, background: `radial-gradient(circle at 18% 18%,${theme.glowA} 0%,transparent 48%),radial-gradient(circle at 82% 18%,${theme.glowB} 0%,transparent 48%),radial-gradient(circle at 75% 88%,${theme.glowC} 0%,transparent 52%)` }} />
            <span aria-hidden="true" style={{ position: "relative", display: "grid", placeItems: "center", minHeight: 69, filter: "drop-shadow(0 4px 8px rgba(73,47,88,.10))" }}><PlushMascot theme={theme.id} size={104} /></span>
            <span style={{ position: "relative", display: "block", padding: "6px 4px 8px", background: "var(--pl-theme-surface-2)", color: "var(--pl-theme-ink)", borderTop: "1px solid var(--pl-theme-line)", fontSize: 12 }}>{theme.label}{selected ? " ✓" : ""}</span>
          </button>;
        })}
      </div>
      {preferences.nickname_style === "baby" && (
        <div style={{ marginTop: 12, padding: 11, borderRadius: 14, background: "var(--pl-theme-surface)", border: "1px solid var(--pl-theme-line,#E9DDF6)" }}>
          <BabyModeExplainer />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, marginTop: 8 }}>
            <button type="button" onClick={() => updatePreference({ baby_voice: "motherly" })} style={{ ...secondaryButton, border: (preferences.baby_voice || "motherly") === "motherly" ? "2px solid #9660AF" : secondaryButton.border }}>Motherly · Mommy</button>
            <button type="button" onClick={() => updatePreference({ baby_voice: "fatherly" })} style={{ ...secondaryButton, border: preferences.baby_voice === "fatherly" ? "2px solid #9660AF" : secondaryButton.border }}>Fatherly · Daddy</button>
          </div>
        </div>
      )}
      {dinoTheme && <div style={{ marginTop: 10, padding: "9px 11px", borderRadius: 13, background: "var(--pl-theme-surface-2,#F3F8F3)", border: "1px solid var(--pl-theme-line,#E9DDF6)", color: "var(--pl-theme-ink,#5C7565)", fontSize: 11.2, lineHeight: 1.4 }}>🦕 Dino is its own theme. Choosing Lavender, Pink, Mint, Peach, Night, Strawberry, Cloud, or Baby automatically turns Dino off.</div>}
    </>
  );
}
