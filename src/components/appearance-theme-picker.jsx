import { themeAtmosphere, DARK_THEME_PALETTES } from "../theme-atmosphere.js";
import { ThemeScene } from "./theme-world.jsx";

const secondaryButton = {
  padding: "9px 12px",
  borderRadius: 13,
  border: "1px solid var(--pl-theme-line,#E9DDF6)",
  background: "var(--pl-theme-surface)",
  color: "var(--pl-theme-ink,#755D82)",
  fontWeight: 800,
  cursor: "pointer",
};

function BabyModeExplainer({ voice = "motherly" }) {
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
      <strong style={{ color: "var(--pl-theme-ink,#5B3D70)" }}>What is {voice === "fatherly" ? "Daddy Mode" : "Mommy Mode"}?</strong> A cozy nursery with {voice === "fatherly" ? "Daddy-style" : "Mommy-style"} encouragement, little-job wording, and softer decoration for your daily routine.
      <button type="button" onClick={dismiss} style={{ marginTop: 6, display: "block", minHeight: 32, padding: "4px 10px", borderRadius: 8, border: "1px solid var(--pl-theme-line,#E9DDF6)", background: "var(--pl-theme-surface)", color: "var(--pl-theme-ink)", fontWeight: 900, fontSize: 11, cursor: "pointer" }}>Got it</button>
    </div>
  );
}

export function AppearanceThemePicker({ preferences, appearanceTheme, selectAppearanceTheme, dinoTheme, updatePreference }) {
  const { APPEARANCE_THEMES } = window.PlushLifeContent;
  const selected = preferences.nickname_style === "baby" ? "baby" : dinoTheme ? "dino" : appearanceTheme;
  const choices = [{id:"none",label:"No theme"},{id:"dino",label:"Dino"},{id:"baby",label:preferences.baby_voice === "fatherly" ? "Daddy Mode" : "Mommy Mode"},...APPEARANCE_THEMES];
  const choose = id => {
    if (id === "dino") updatePreference({ dino_theme: true, nickname_style: "warm" });
    else if (id === "baby") updatePreference({ nickname_style: "baby", dino_theme: false });
    else selectAppearanceTheme(id);
  };
  return <>
    <div style={{fontSize:11.5,fontWeight:900,color:"var(--pl-theme-ink)"}}>APPEARANCE</div>
    <div role="group" aria-label="Choose light or dark appearance" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,margin:"7px 0 13px"}}>
      <button type="button" className="pl-appearance-option" aria-pressed={!preferences.dark_mode} onClick={()=>updatePreference({dark_mode:false})} style={secondaryButton}>☀ Light</button>
      <button type="button" className="pl-appearance-option" aria-pressed={!!preferences.dark_mode} onClick={()=>updatePreference({dark_mode:true})} style={secondaryButton}>☾ Dark</button>
    </div>
    <div style={{fontSize:11.5,fontWeight:900,color:"var(--pl-theme-ink)"}}>YOUR WORLD</div>
    <p style={{fontSize:12,lineHeight:1.45,color:"var(--pl-theme-muted)",margin:"5px 0 10px"}}>Choose the place around your plush. Each world has its own scenery and feeling.</p>
    <div className="pl-theme-picker" aria-label="Choose your theme">
      {choices.map(choice=>{
        const id=choice.id;
        const atmosphere=themeAtmosphere(id);
        const palette=preferences.dark_mode ? DARK_THEME_PALETTES[id === "baby" ? "baby-night" : id] : window.PlushLifeThemeCopy.worlds[id];
        const scene=id==="baby" && preferences.dark_mode ? "nursery-night" : atmosphere.scene;
        return <button type="button" key={id} className="pl-world-choice" data-theme-choice={id} aria-pressed={selected===id} onClick={()=>choose(id)} style={{"--pl-preview-bg":palette?.surface2 || (preferences.dark_mode ? "#34303e" : "#efedf2"),"--pl-preview-ink":palette?.ink || "#453f4b"}}>
          <span className="pl-world-preview" aria-hidden="true">{scene && <img className="pl-world-preview-scenery" src={`./assets/worlds/${scene}.svg`} width="640" height="240" alt=""/>}<span className="pl-world-preview-plush"><ThemeScene world={id} decorative focus/></span></span>
          <span className="pl-world-choice-name">{choice.label}{selected===id ? " ✓" : ""}</span><small>{atmosphere.description}</small>
        </button>;
      })}
    </div>
    {preferences.nickname_style === "baby" && <><BabyModeExplainer voice={preferences.baby_voice}/><div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:7,marginTop:8}}>
      <button type="button" className="pl-appearance-option" aria-pressed={(preferences.baby_voice || "motherly") === "motherly"} onClick={()=>updatePreference({baby_voice:"motherly"})} style={secondaryButton}>Mommy Mode · Motherly</button>
      <button type="button" className="pl-appearance-option" aria-pressed={preferences.baby_voice === "fatherly"} onClick={()=>updatePreference({baby_voice:"fatherly"})} style={secondaryButton}>Daddy Mode · Fatherly</button>
    </div></>}
  </>;
}
