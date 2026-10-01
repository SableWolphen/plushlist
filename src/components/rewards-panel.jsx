import { nextCompanionReward } from "../companion-experience.js";
import { CozyScene, ThemeScene, useThemeCopy } from "./theme-world.jsx";
import { ToolPanel } from "./shared.jsx";

export function RewardsPanel({ saveMessage, open, onClose, inline = false, selectedOutfit, activityDaysTotal, preferences, mascotGrowth, unlockedOutfits, earnedBadgeIdSet, BADGE_DEFS, unlockedIdSet, mascotRequirementProgress, saveMascotCollection, mascotCollection, savedBestStreak, collectionTab, setCollectionTab, winsJarEntries, theme }) {
  const [showAllOutfits, setShowAllOutfits] = React.useState(false);
  const [showAllBadges, setShowAllBadges] = React.useState(false);
  const [shownWins, setShownWins] = React.useState(6);
  const copy = useThemeCopy();
  if (!open) return null;
  const { MASCOT_OUTFITS } = window.PlushLifeContent;
  const available = MASCOT_OUTFITS.filter(item => unlockedIdSet.has(item.id));
  const locked = MASCOT_OUTFITS.filter(item => !unlockedIdSet.has(item.id));
  const earned = BADGE_DEFS.filter(item => earnedBadgeIdSet.has(item.id));
  const nextReward = nextCompanionReward(MASCOT_OUTFITS, unlockedIdSet, mascotRequirementProgress);
  const next = nextReward?.outfit;
  const wear = (outfit) => {
    if (!unlockedIdSet.has(outfit.id)) return;
    saveMascotCollection({ ...mascotCollection, bestStreak: savedBestStreak, unlockedIds: [...unlockedIdSet], selectedId: outfit.id });
  };
  const outfitCard = (outfit, unlocked) => {
    const selected = selectedOutfit.id === outfit.id;
    const progress = Math.min(outfit.unlock.count, mascotRequirementProgress(outfit));
    return <button key={outfit.id} type="button" className="pl-collection-item" disabled={!unlocked} aria-pressed={unlocked ? selected : undefined} onClick={() => wear(outfit)}>
      <span className="pl-outfit-preview"><ThemeScene outfit={outfit} focus decorative/></span>
      <strong>{outfit.name}</strong>
      <span>{unlocked ? selected ? "✓ Wearing now" : "Wear this look" : `${progress} / ${outfit.unlock.count}`}</span>
      {!unlocked && <small>{outfit.hint}</small>}
    </button>;
  };
  return <ToolPanel title="🧸 Plush & Keepsakes" displayTitle="Plush Corner" inline={inline} hideClose={inline} onClose={onClose}>
    <div className="pl-closet-shell">
      <CozyScene title="Your plush, growing with you." subtitle={copy["Your story is bigger than a streak."] || "Tiny steps. Big hugs."} outfit={selectedOutfit} focus />
      <section className="pl-design-card pl-closet-summary">
        <h2>Wearing · {selectedOutfit.name}</h2>
        {saveMessage && <p role="status">{saveMessage}</p>}
        <p>{activityDaysTotal} caring days · {unlockedOutfits.length} outfits · {earnedBadgeIdSet.size} badges</p>
        <div role="tablist" aria-label="Your collection" className="pl-collection-tabs">
          {[["mascot", "Closet"], ["badges", "Badges"], ["wins", "Jar"]].map(([id, label]) => <button type="button" key={id} role="tab" aria-selected={collectionTab === id} onClick={() => setCollectionTab(id)}>{label}</button>)}
        </div>
      </section>
      <div role="tabpanel" aria-label={collectionTab === "mascot" ? "Closet" : collectionTab === "badges" ? "Badges" : "Kindness jar"}>
        {collectionTab === "mascot" && <>
          <section className="pl-design-card">
            <h2>Choose a look · {available.length}</h2><p className="pl-closet-help">Tap a plush to wear that look. One look at a time; every earned reward stays yours.</p>
            <div className="pl-collection-grid">{(showAllOutfits ? available : [selectedOutfit, ...available.filter(item => item.id !== selectedOutfit.id)].slice(0, 6)).map(item => outfitCard(item, true))}</div>
            {available.length > 6 && <button type="button" className="pl-collection-more" aria-expanded={showAllOutfits} onClick={() => setShowAllOutfits(value => !value)}>{showAllOutfits ? "Show fewer outfits" : `See all ${available.length} outfits`}</button>}
          </section>
          {next && <section className="pl-design-card pl-next-unlock"><h2>Next little unlock</h2><p>{next.badge} {next.name} · {nextReward.count} / {nextReward.total}</p><p>{nextReward.copy}. {next.hint}</p><progress value={nextReward.count} max={nextReward.total} aria-label={`Progress toward ${next.name}`} /></section>}
          {locked.length > 0 && <details className="pl-design-card pl-collection-details"><summary>Still to unlock · {locked.length}</summary><p>Your progress is shown on each reward. Everything you earn stays yours.</p><div className="pl-collection-grid">{locked.map(item => outfitCard(item, false))}</div></details>}
        </>}
        {collectionTab === "badges" && <>
          <section className="pl-design-card"><h2>Little celebrations · {earned.length}</h2><div className="pl-collection-grid">{(showAllBadges ? earned : earned.slice(0, 6)).map(item => <article className="pl-collection-item" key={item.id}><span className="pl-collection-icon" aria-hidden="true">{item.badge}</span><strong>{item.name}</strong><span>Earned</span></article>)}</div>{!earned.length && <p>Your first badge is waiting for a little care.</p>}{earned.length > 6 && <button type="button" className="pl-collection-more" aria-expanded={showAllBadges} onClick={() => setShowAllBadges(value => !value)}>{showAllBadges ? "Show fewer badges" : `See all ${earned.length} badges`}</button>}</section>
          <details className="pl-design-card pl-collection-details"><summary>Badges to discover · {BADGE_DEFS.length - earned.length}</summary><div className="pl-collection-grid">{BADGE_DEFS.filter(item => !earnedBadgeIdSet.has(item.id)).map(item => <article key={item.id} className="pl-collection-item"><span className="pl-collection-icon" aria-hidden="true">{item.badge}</span><strong>{item.name}</strong><small>{item.hint}</small></article>)}</div></details>
        </>}
        {collectionTab === "wins" && <section className="pl-design-card"><h2>{theme?.startsWith("baby") ? "Nursery keepsakes" : theme === "dino" ? "Adventure keepsakes" : "Your kindness jar"}</h2><p>Little moments, kept with love.</p>{!winsJarEntries.length && <p>Your first little win will find a home here.</p>}<div className="pl-wins-list">{winsJarEntries.slice(0, shownWins).map(entry => <article key={entry.date}><span aria-hidden="true">{entry.emoji}</span><div><strong>{entry.title}</strong><time dateTime={entry.date}>{new Date(`${entry.date}T12:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time><p>{entry.text}</p></div></article>)}</div>{shownWins < winsJarEntries.length && <button type="button" className="pl-collection-more" onClick={() => setShownWins(value => value + 10)}>More little memories</button>}</section>}
      </div>
      <details className="pl-design-card pl-collection-details"><summary>Little celebration settings</summary><p>Earned rewards stay yours, even when you take time away.</p><label className="pl-collection-setting"><input type="checkbox" checked={mascotCollection.celebrationSound} onChange={event => saveMascotCollection({ ...mascotCollection, bestStreak: savedBestStreak, unlockedIds: [...unlockedIdSet], celebrationSound: event.target.checked })} />Play a soft chime at 100% (silent during quiet hours)</label><p>Reduce animation in Settings keeps celebrations still and calm.</p></details>
    </div>
  </ToolPanel>;
}
