export function RewardMoment({ outfit, onWear, onDismiss }) {
  if (!outfit) return null;
  return <section className="pl-reward-moment" aria-label="New plush reward">
    <div role="status" aria-live="polite"><strong><span aria-hidden="true">{outfit.badge}</span> You earned {outfit.name}!</strong><p>{outfit.id === 'bow' ? 'Your first completed step. A little counts.' : outfit.hint}</p></div>
    <div className="pl-reward-actions"><button type="button" onClick={()=>onWear(outfit)}>Wear it</button><button type="button" onClick={onDismiss}>Later</button></div>
  </section>;
}
