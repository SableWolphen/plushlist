import { availableGuardianGifts } from "../guardian-auto-rewards.mjs";
import {
  ROUTINES,
  localDate,
  reflectionPatterns,
  taskSteps,
} from "../plush-guardian-model.mjs";
const uid = () => crypto.randomUUID();
export function GuardianTools({
  page,
  state,
  update,
  setMessage,
  onQuickAdd,
  onSupport,
  onClose,
  onJournal,
  rows = [],
  viewDone = {},
}) {
  const [draft, setDraft] = React.useState("");
  const [name, setName] = React.useState("");
  const [date, setDate] = React.useState(localDate());
  const [feeling, setFeeling] = React.useState("okay");
  const [helped, setHelped] = React.useState("");
  const [photo, setPhoto] = React.useState("");
  const [filter, setFilter] = React.useState("");
  const [review, setReview] = React.useState(null);
  const [busy, setBusy] = React.useState(false);
  const [goal, setGoal] = React.useState(3);
  const [rewardMode, setRewardMode] = React.useState("progress");
  const [rewardTargetPercent, setRewardTargetPercent] = React.useState(75);
  const [small, setSmall] = React.useState(false);
  const [together, setTogether] = React.useState(false);
  React.useEffect(() => {
    setDraft("");
    setName("");
    setReview(null);
    setFilter("");
    setPhoto("");
    setSmall(false);
  }, [page]);
  const persistList = (key, item) => {
    if (
      update({
        [key]: [item, ...state[key]].slice(0, key === "reflections" ? 60 : 100),
      })
    ) {
      setDraft("");
      setName("");
      setPhoto("");
      setHelped("");
      return true;
    }
    return false;
  };
  const remove = (key, id) =>
    update({ [key]: state[key].filter((x) => x.id !== id) });
  const imageFile = async (file) => {
    if (!file) return;
    setBusy(true);
    try {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type) || file.size > 10000000)
        throw Error("Choose a JPG, PNG, or WebP photo under 10 MB.");
      const bitmap = await createImageBitmap(file);
      const scale = Math.min(1, 800 / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement("canvas");
      canvas.width = bitmap.width * scale;
      canvas.height = bitmap.height * scale;
      canvas
        .getContext("2d")
        .drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      bitmap.close();
      const encoded = canvas.toDataURL("image/jpeg", 0.65);
      if (encoded.length > 450000)
        throw Error("This photo is too large to save. Try a smaller photo.");
      setPhoto(encoded);
    } catch (error) {
      setMessage(error.message || "Couldn’t open that photo.");
    } finally {
      setBusy(false);
    }
  };
  if (page === "inbox")
    return (
      <section>
        <h2>Brain dump</h2>
        <p>Let it out now. Organize it when you’re ready.</p>
        <label>
          A thought or task
          <textarea
            value={draft}
            maxLength={1000}
            onChange={(e) => setDraft(e.target.value)}
          />
        </label>
        <button
          disabled={!draft.trim()}
          onClick={() =>
            persistList("inbox", {
              id: uid(),
              text: draft.trim(),
              date: localDate(),
            })
          }
        >
          Keep in my inbox
        </button>
        {state.inbox.map((item) => (
          <article key={item.id}>
            <p>{item.text}</p>
            <small>{item.date}</small>
            <div className="pl-companion-grid">
              <button
                onClick={() =>
                  setReview({
                    id: item.id,
                    text: item.text.slice(0, 140),
                    when: "today",
                  })
                }
              >
                Turn into a task
              </button>
              <button
                onClick={() => {
                  update({
                    reflections: [
                      {
                        id: uid(),
                        text: item.text,
                        date: localDate(),
                        feeling: "okay",
                        helped: "",
                      },
                      ...state.reflections,
                    ].slice(0, 60),
                    inbox: state.inbox.filter((x) => x.id !== item.id),
                  });
                }}
              >
                Keep as a reflection
              </button>
              <button onClick={() => remove("inbox", item.id)}>Remove</button>
            </div>
          </article>
        ))}
        {review && (
          <section className="pl-companion-review">
            <h3>Review new task</h3>
            <label>
              Task name
              <input
                value={review.text}
                maxLength={140}
                onChange={(e) => setReview({ ...review, text: e.target.value })}
              />
            </label>
            <label>
              When
              <select
                value={review.when}
                onChange={(e) => setReview({ ...review, when: e.target.value })}
              >
                <option value="today">Today</option>
                <option value="tomorrow">Tomorrow</option>
              </select>
            </label>
            <p>
              Add this as a one-time task. Your original thought remains until
              you remove it.
            </p>
            <button
              disabled={busy || !review.text.trim()}
              onClick={async () => {
                setBusy(true);
                try {
                  const okay = await onQuickAdd(review.text, review.when);
                  if (okay) {
                    setReview(null);
                    setMessage(
                      "Task added. Your original thought is still in the inbox.",
                    );
                  } else
                    setMessage(
                      "Couldn’t add it, or a matching task already exists. Your thought is safe.",
                    );
                } catch (_) {
                  setMessage("Couldn’t add the task. Try again.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Add this task
            </button>
            <button disabled={busy} onClick={() => setReview(null)}>
              Cancel
            </button>
          </section>
        )}
      </section>
    );
  if (page === "routines") {
    const active = state.activeRoutine;
    const all = [...ROUTINES, ...state.routines];
    const start = (routine) => {
      const steps = routine.steps.map((text) => ({ text, status: "pending" }));
      update({
        activeRoutine: {
          id: uid(),
          name: routine.name,
          steps,
          index: 0,
          paused: false,
          started: localDate(),
        },
      });
      setSmall(false);
    };
    const advance = (status) => {
      const next = {
        ...active,
        steps: active.steps.map((s, i) =>
          i === active.index ? { ...s, status } : s,
        ),
        index: active.index + 1,
        paused: false,
      };
      update({ activeRoutine: next });
      setSmall(false);
      if (state.prefs.haptics) navigator.vibrate?.(20);
      if (state.prefs.sound) {
        try {
          const Audio = window.AudioContext || window.webkitAudioContext;
          const ctx = new Audio();
          const oscillator = ctx.createOscillator();
          const gain = ctx.createGain();
          gain.gain.value = 0.035;
          oscillator.connect(gain).connect(ctx.destination);
          oscillator.start();
          oscillator.stop(ctx.currentTime + 0.15);
          oscillator.onended = () => ctx.close();
        } catch (_) {}
      }
    };
    return (
      <section>
        <h2>My routines</h2>
        <p>
          One step at a time. Routine steps stay separate from your task
          checkmarks.
        </p>
        {active ? (
          <article className="pl-companion-routine">
            <img
              src="./assets/plushlife-mascot.svg"
              width="96"
              height="96"
              alt="Your Plush"
            />
            <h3>{active.name}</h3>
            {active.index < active.steps.length ? (
              <>
                <p>
                  Step {active.index + 1} of {active.steps.length}
                  {active.paused ? " · Paused" : ""}
                </p>
                <progress value={active.index} max={active.steps.length} />
                <h2>{active.steps[active.index].text}</h2>
                <p>
                  {small
                    ? taskSteps({ label: active.steps[active.index].text })[0]
                    : "Take the time you need."}
                </p>
                {together && (
                  <p>
                    Take turns or do this step side by side. Share this screen
                    only with someone you choose.
                  </p>
                )}
                {active.paused ? (
                  <button
                    onClick={() =>
                      update({ activeRoutine: { ...active, paused: false } })
                    }
                  >
                    Resume routine
                  </button>
                ) : (
                  <>
                    <button
                      className="pl-companion-primary"
                      onClick={() => advance("done")}
                    >
                      I did this
                    </button>
                    <button onClick={() => setSmall(true)}>
                      Make it smaller
                    </button>
                    <div className="pl-companion-grid">
                      <button
                        onClick={() =>
                          update({ activeRoutine: { ...active, paused: true } })
                        }
                      >
                        Pause
                      </button>
                      <button onClick={() => advance("skipped")}>
                        Skip for now
                      </button>
                    </div>
                  </>
                )}
                <p>
                  Next:{" "}
                  {active.steps[active.index + 1]?.text ||
                    "A little moment to rest"}
                </p>
              </>
            ) : (
              <>
                <h3>Your routine is finished</h3>
                <p>
                  {active.steps.filter((s) => s.status === "done").length} steps
                  done ·{" "}
                  {active.steps.filter((s) => s.status === "skipped").length}{" "}
                  skipped. Your effort counts.
                </p>
                <button onClick={() => update({ activeRoutine: null })}>
                  Close routine
                </button>
              </>
            )}
            <details>
              <summary>Routine options</summary>
              <label>
                <input
                  type="checkbox"
                  checked={together}
                  onChange={(e) => setTogether(e.target.checked)}
                />
                Do this together on this device
              </label>
              <button
                onClick={() => {
                  onClose();
                  onSupport?.(
                    `Would you join me for “${active.name}”? These are the steps I chose to share: ${active.steps.map((s) => s.text).join("; ")}`,
                  );
                }}
              >
                Review invitation in My Guardians
              </button>
              <button onClick={() => setReview({ end: true })}>
                End this routine
              </button>
              {review?.end && (
                <div>
                  <p>End this routine and clear its saved place?</p>
                  <button
                    onClick={() => {
                      update({ activeRoutine: null });
                      setReview(null);
                    }}
                  >
                    End routine
                  </button>
                  <button onClick={() => setReview(null)}>Keep it</button>
                </div>
              )}
            </details>
          </article>
        ) : (
          <>
            <div className="pl-companion-choices">
              {all.map((r) => (
                <article key={r.id}>
                  <strong>{r.name}</strong>
                  <p>{r.steps.length} steps · Preview before starting</p>
                  <button onClick={() => setReview(r)}>Review routine</button>
                  {!ROUTINES.some((x) => x.id === r.id) && (
                    <button onClick={() => remove("routines", r.id)}>
                      Remove
                    </button>
                  )}
                </article>
              ))}
            </div>
            {review?.steps && (
              <section className="pl-companion-review">
                <h3>{review.name}</h3>
                <ol>
                  {review.steps.map((text, i) => (
                    <li key={i}>{text}</li>
                  ))}
                </ol>
                <button
                  onClick={() => {
                    start(review);
                    setReview(null);
                  }}
                >
                  Start this routine
                </button>
                <button onClick={() => setReview(null)}>Cancel</button>
              </section>
            )}
            <details>
              <summary>Create my own routine</summary>
              <label>
                Name
                <input
                  value={name}
                  maxLength={80}
                  onChange={(e) => setName(e.target.value)}
                />
              </label>
              <label>
                Steps, one per line
                <textarea
                  value={draft}
                  maxLength={2000}
                  onChange={(e) => setDraft(e.target.value)}
                />
              </label>
              <button
                disabled={!name.trim() || !draft.trim()}
                onClick={() =>
                  persistList("routines", {
                    id: uid(),
                    name: name.trim(),
                    steps: draft
                      .split("\n")
                      .map((x) => x.trim())
                      .filter(Boolean)
                      .slice(0, 20),
                  })
                }
              >
                Save routine
              </button>
            </details>
          </>
        )}
      </section>
    );
  }
  if (page === "reflections") {
    const patterns = reflectionPatterns(state.reflections);
    return (
      <section>
        <h2>My private reflections</h2>
        <p>
          Notes and photos stay on this device. Photos are resized and location
          metadata is removed. Clearing app data removes these memories.
        </p>
        <button
          onClick={() => {
            onClose();
            onJournal?.();
          }}
        >
          Open my existing daily journal
        </button>
        <label>
          My reflection
          <textarea
            value={draft}
            maxLength={2000}
            onChange={(e) => setDraft(e.target.value)}
          />
        </label>
        <label>
          Feeling
          <select value={feeling} onChange={(e) => setFeeling(e.target.value)}>
            {[
              "happy",
              "calm",
              "okay",
              "tired",
              "overwhelmed",
              "proud",
              "hopeful",
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
        <label>
          What helped? (optional)
          <input
            value={helped}
            maxLength={120}
            onChange={(e) => setHelped(e.target.value)}
          />
        </label>
        <label>
          Private photo (optional)
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => imageFile(e.target.files?.[0])}
          />
        </label>
        {photo && (
          <img
            className="pl-companion-photo"
            src={photo}
            alt="Photo to attach"
          />
        )}
        <button
          disabled={busy || !draft.trim()}
          onClick={() =>
            persistList("reflections", {
              id: uid(),
              date: localDate(),
              text: draft.trim(),
              feeling,
              helped: helped.trim(),
              photo,
            })
          }
        >
          Save reflection
        </button>
        <details>
          <summary>What helped me?</summary>
          <p>
            Counts come only from the “What helped?” words you entered. They do
            not establish cause or diagnose anything.
          </p>
          {patterns.length ? (
            patterns.map((p) => (
              <p key={p.label}>
                {p.label} · recorded {p.count}{" "}
                {p.count === 1 ? "time" : "times"}
                <small> · {p.dates.join(", ")}</small>
              </p>
            ))
          ) : (
            <p>Add what helped to a reflection to see your own patterns.</p>
          )}
        </details>
        <label>
          Search words or feelings
          <input
            type="search"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </label>
        {state.reflections
          .filter((x) =>
            `${x.text} ${x.feeling} ${x.helped}`
              .toLowerCase()
              .includes(filter.toLowerCase()),
          )
          .map((x) => (
            <article key={x.id}>
              <small>
                {x.date} · {x.feeling}
              </small>
              <p>{x.text}</p>
              {x.photo && (
                <img
                  className="pl-companion-photo"
                  src={x.photo}
                  alt="Your private reflection photo"
                />
              )}
              {x.helped && <p>What helped: {x.helped}</p>}
              <button onClick={() => remove("reflections", x.id)}>
                Delete reflection
              </button>
            </article>
          ))}
      </section>
    );
  }
  if (page === "letters")
    return (
      <section>
        <h2>Letters to future me</h2>
        <label>
          Open on
          <input
            type="date"
            min={localDate()}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </label>
        <label>
          Something you want to hear
          <textarea
            maxLength={2000}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
        </label>
        <button
          disabled={!draft.trim() || date < localDate()}
          onClick={() =>
            persistList("letters", { id: uid(), date, text: draft.trim() })
          }
        >
          Keep this letter
        </button>
        <p>
          Letters become available here on the chosen date. No notification is
          sent.
        </p>
        {state.letters.map((x) => (
          <article key={x.id}>
            <strong>
              {x.date <= localDate()
                ? "Ready to open"
                : "Waiting for " + x.date}
            </strong>
            {x.date <= localDate() && (
              <details>
                <summary>Read my letter</summary>
                <p>{x.text}</p>
              </details>
            )}
            <button onClick={() => remove("letters", x.id)}>
              Delete letter
            </button>
          </article>
        ))}
      </section>
    );
  if (page === "rewards") {
    const todayTasks = rows.filter(r => r?.key && !r.isBonus && !r.sourceTask?.archived_at);
    const todayDone = todayTasks.filter(r => !!viewDone[r.key]).length;
    const baseTotal = state.rewardProgress?.date === localDate() ? Math.max(todayTasks.length, Number(state.rewardProgress.total) || 0) : todayTasks.length;
    const todayPercent = baseTotal ? Math.round(todayDone * 100 / baseTotal) : 0;
    const availableGifts = availableGuardianGifts(state.automaticGiftLedger, state.usedGuardianGifts);
    const availableCustom = state.rewards.filter(x=>x && x.claimed && x.autoAwardedAt && !x.usedAt);
    const usedCustom = state.rewards.filter(x=>x && x.usedAt);
    const availableCount = availableGifts.length + availableCustom.length;
    return (
      <section>
        <h2>🎁 My Guardian Rewards</h2>
        <div className="pl-companion-review" aria-label="Earned Guardian rewards">
          <h3>Ready to enjoy ({availableCount})</h3>
          <p>These are rewards you already earned. Tap Use reward when you enjoy one. It leaves this list and stays in your history.</p>
          {availableCount === 0 && <p>No unused rewards right now. Your next little victory will show up here! 💜</p>}
          {availableGifts.map(gift=><article key={gift.id} className="pl-guardian-earned-reward">
            <div><strong>{gift.name}</strong><small> Earned {gift.date}</small></div>
            <button type="button" onClick={()=>update({usedGuardianGifts:[...new Set([...(state.usedGuardianGifts||[]),gift.id])].slice(-180)})}>Use reward</button>
          </article>)}
          {availableCustom.map(reward=><article key={reward.id} className="pl-guardian-earned-reward">
            <div><strong>🎁 {reward.name}</strong><small> From Guardian</small></div>
            <button type="button" onClick={()=>update({rewards:state.rewards.map(x=>x.id===reward.id?{...x,usedAt:new Date().toISOString()}:x)})}>Use reward</button>
          </article>)}
          <details>
            <summary>Used rewards ({(state.usedGuardianGifts||[]).length + usedCustom.length})</summary>
            {(state.usedGuardianGifts||[]).slice(-12).reverse().map(id=><p key={id}>✓ {id.slice(0,10)} · Guardian gift enjoyed</p>)}
            {usedCustom.slice(-12).reverse().map(x=><p key={x.id}>✓ {x.name}</p>)}
          </details>
        </div>
        <p>Completed rewards appear above until you use them. You can also create your own. Basic needs never have to be earned.</p>
        <label>
          My reward
          <input
            value={name}
            maxLength={100}
            onChange={(e) => setName(e.target.value)}
            placeholder="A cozy movie night"
          />
        </label>
        <label>
          What counts as a step?
          <input
            value={draft}
            maxLength={200}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Trying my morning routine"
          />
        </label>
        <label>
          When to unlock
          <select aria-label="Reward goal type" value={rewardMode} onChange={e=>setRewardMode(e.target.value)}>
            <option value="progress">Today's task progress</option>
            <option value="effort">Count my effort manually</option>
          </select>
        </label>
        {rewardMode === "progress" ? <label>
          Unlock at task completion
          <select aria-label="Reward target percent" value={rewardTargetPercent} onChange={e=>setRewardTargetPercent(Number(e.target.value))}>
            <option value={25}>25%</option><option value={50}>50%</option><option value={75}>75%</option><option value={100}>100%</option>
          </select>
        </label> : <label>
          Number of steps
          <input type="number" min="1" max="100" value={goal} onChange={e=>setGoal(e.target.value)} />
        </label>}
        <button
          disabled={
            !name.trim() ||
            !draft.trim() ||
            (rewardMode === "effort" && !(Number(goal) >= 1 && Number(goal) <= 100))
          }
          onClick={() =>
            persistList("rewards", {
              id: uid(),
              name: name.trim(),
              text: draft.trim(),
              goal: Math.floor(Number(goal)),
              count: 0,
              mode: rewardMode,
              targetPercent: rewardMode === "progress" ? rewardTargetPercent : null,
              claimed: false,
            })
          }
        >
          Create my reward
        </button>
        {state.rewards.filter(x=>!x.claimed).map((x) => (
          <article key={x.id}>
            <h3>{x.name}</h3>
            <p>{x.text}</p>
            <progress value={x.mode === "progress" ? todayPercent : x.count} max={x.mode === "progress" ? 100 : x.goal} />
            <p>{x.mode === "progress" ? `Today: ${todayDone}/${baseTotal} little jobs · ${todayPercent}% · Goal ${x.targetPercent}%` : `${x.count} / ${x.goal} steps`}</p>
            {x.claimed ? <p role="status">🎁 {x.autoAwardedAt ? "Guardian unlocked this for you automatically!" : "Reward already enjoyed!"}</p> : x.mode !== "progress" && x.count < x.goal ? (
              <button
                onClick={() =>
                  update({
                    rewards: state.rewards.map((r) =>
                      r.id === x.id ? { ...r, count: r.count + 1 } : r,
                    ),
                  })
                }
              >
                Count one effort
              </button>
            ) : (
              <button
                disabled={x.claimed || (x.mode === "progress" && (baseTotal === 0 || todayPercent < (x.targetPercent || 100)))}
                onClick={() =>
                  update({
                    rewards: state.rewards.map((r) =>
                      r.id === x.id ? { ...r, claimed: true, usedAt: new Date().toISOString() } : r,
                    ),
                  })
                }
              >
                {x.claimed ? "Reward unlocked" : "Enjoy my reward"}
              </button>
            )}
            {x.mode !== "progress" && x.count > 0 && !x.claimed && (
              <button
                onClick={() =>
                  update({
                    rewards: state.rewards.map((r) =>
                      r.id === x.id ? { ...r, count: r.count - 1 } : r,
                    ),
                  })
                }
              >
                Undo one step
              </button>
            )}
            <button onClick={() => remove("rewards", x.id)}>
              Remove reward
            </button>
          </article>
        ))}
      </section>
    );
  }
  if (page === "experiments")
    return (
      <section>
        <h2>Try a habit for a week</h2>
        <p>
          A small experiment, not a promise. Record what fits and decide whether
          to keep it.
        </p>
        <label>
          Something to try
          <input
            maxLength={160}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Read one page"
          />
        </label>
        <label>
          After which daily cue?
          <input
            maxLength={160}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="After breakfast"
          />
        </label>
        <button
          disabled={!name.trim()}
          onClick={() =>
            persistList("experiments", {
              id: uid(),
              name: name.trim(),
              cue: draft.trim(),
              date: localDate(),
              days: [],
              decision: "",
            })
          }
        >
          Start my experiment
        </button>
        {state.experiments.map((x) => (
          <article key={x.id}>
            <h3>{x.name}</h3>
            <p>
              {x.cue ? "After: " + x.cue : "Choose a moment that fits."} ·
              Started {x.date}
            </p>
            <p>{x.days.length} days tried</p>
            <button
              disabled={!!x.decision || x.days.includes(localDate())}
              onClick={() =>
                update({
                  experiments: state.experiments.map((r) =>
                    r.id === x.id
                      ? { ...r, days: [...r.days, localDate()] }
                      : r,
                  ),
                })
              }
            >
              I tried it today
            </button>
            <label>
              My review
              <select
                value={x.decision}
                onChange={(e) =>
                  update({
                    experiments: state.experiments.map((r) =>
                      r.id === x.id ? { ...r, decision: e.target.value } : r,
                    ),
                  })
                }
              >
                <option value="">Still trying</option>
                <option value="keep">Keep this idea</option>
                <option value="smaller">Try something smaller</option>
                <option value="release">Let it go</option>
              </select>
            </label>
            {x.decision === "keep" && (
              <p>
                Keep this as a reflection, or add it as a repeating habit in
                Tasks.
              </p>
            )}
            <button onClick={() => remove("experiments", x.id)}>
              Remove experiment
            </button>
          </article>
        ))}
      </section>
    );
  return null;
}
