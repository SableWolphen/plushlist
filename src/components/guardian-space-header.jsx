import { CozyScene, DesignIcon } from "./theme-world.jsx";

export const GUARDIAN_SPACE_PAGES = [["home","Overview"],["tasks","Tasks"],["checkins","Check-ins"],["reference","Reference"],["agreement","Agreement"]];

export function GuardianSpaceHeader({ area, onSelect, relationshipLabel, loading, caretaker, onSupport, onRewards }) {
  return <>
    <header className="pl-calm-relationship-heading" aria-label="Optional human Guardian">
      <div><span className="pl-calm-eyebrow">A little care, together</span><h1>Your shared space</h1><p>{loading ? "Checking your connections…" : relationshipLabel}</p></div>
      <button type="button" className="pl-calm-sharing-link" aria-pressed={area==="overview"} onClick={()=>onSelect("overview")}><DesignIcon name="gear"/>Sharing & permissions</button>
    </header>
    <nav className="pl-calm-guardian-tabs" aria-label="Guardian sections">
      {GUARDIAN_SPACE_PAGES.map(([id,label])=><button key={id} type="button" aria-pressed={area===id} onClick={()=>onSelect(id)}>{label}</button>)}
    </nav>
    {area === "home" && <>
      <div className="pl-calm-guardian-hero">
        <CozyScene title="Good days, soft days. Here for both." subtitle="Small steps and honest check-ins. You choose what to share, every time."/>
        <div className="pl-calm-hero-actions"><button type="button" className="pl-calm-primary" onClick={onSupport}><DesignIcon name="care"/>{caretaker ? "Offer a little support" : "Ask for a little support"}</button><button type="button" className="pl-calm-text-button" onClick={()=>onSelect("checkins")}>Write a check-in →</button></div>
      </div>
      <div className="pl-calm-secondary-actions"><button type="button" onClick={()=>onSelect("together")}><DesignIcon name="guardian"/>Together space</button><button type="button" onClick={onRewards}><DesignIcon name="progress"/>Rewards & suggestions</button></div>
    </>}
  </>;
}
