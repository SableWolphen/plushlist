import { ToolPanel } from "./shared.jsx";
import {
  STATE_EVENT,
  guardianStorage,
  readGuardian,
  saveGuardian,
  VOICES,
  localDate,
  chooseTask,
  effort,
  taskSteps,
} from "../plush-guardian-model.mjs";
import { GuardianTools } from "./plush-guardian-tools.jsx";
import { GuardianSettings } from "./plush-guardian-settings.jsx";
import { startFocusTimer } from "./focus-timer.jsx";
import { botGuardianDailyPlan, activateBotMommy } from "../guardian-bot.mjs";
import { guardianBotDisplayName, guardianSuggestedReward } from "../guardian-mode.mjs";
export default function PlushGuardianCore(props) {
  const {
    user,
    rows = [],
    viewDone = {},
    dailyCheckIn = {},
    request,
    onClose,
  } = props;
  const [state, setState] = React.useState(() =>
    readGuardian(guardianStorage(), user.id),
  );
  const ref = React.useRef(state);
  ref.current = state;
  const [page, setPage] = React.useState(request.page);
  const [taskKey, setTaskKey] = React.useState(request.taskKey);
  const [message, setMessage] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [review, setReview] = React.useState(null);
  const [step, setStep] = React.useState(0);
  React.useEffect(() => {
    setPage(request.page);
    setTaskKey(request.taskKey);
    setStep(0);
    setReview(null);
  }, [request.id]);
  const save = (next) => {
    if (!saveGuardian(guardianStorage(), user.id, next)) {
      setMessage(
        "Couldn’t save on this device. Your draft is still here. Free some storage and try again.",
      );
      return false;
    }
    ref.current = next;
    setState(next);
    window.dispatchEvent(new Event(STATE_EVENT));
    setMessage("Saved on this device.");
    return true;
  };
  const update = (patch) => save({ ...ref.current, ...patch });
  const navigate = (p) => {
    setPage(p);
    setReview(null);
    setMessage("");
  };
  React.useEffect(() => {
    document
      .querySelector('[data-plush-panel="Plush Guardian"] .pl-tool-panel')
      ?.scrollTo?.({ top: 0 });
  }, [page]);
  const selected =
    rows.find((r) => r.key === taskKey) ||
    chooseTask(rows, viewDone, state.energy);
  const steps = selected
    ? state.taskSteps[selected.key] || taskSteps(selected)
    : [];
  const botPlan = botGuardianDailyPlan(rows, viewDone, state.prefs.voice, dailyCheckIn?.day_type === "rest");
  const action = async (fn) => {
    if (busy) return;
    setBusy(true);
    try {
      const okay = await fn();
      if (okay === false)
        setMessage("Couldn’t save that change. Please try again.");
      else
        setMessage(
          "Change requested. Check the task and save status for confirmation.",
        );
    } catch (_) {
      setMessage("Couldn’t save that change. Please try again.");
    } finally {
      setBusy(false);
      setReview(null);
    }
  };
  const offlineReply = (kind) => {
    const replies = {
      comfort:
        "You can take this moment at your own pace. Would a quiet pause or one small step help?",
      company:
        "Let’s choose one thing to work on. You can pause or stop whenever you need.",
      overwhelmed:
        "Only this moment needs your attention. Choose one manageable step, or make room to rest.",
    };
    setMessage(replies[kind]);
  };
  return (
    <ToolPanel title="Plush Guardian" onClose={onClose}>
      <div
        className="pl-guardian-companion"
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const panel = event.currentTarget.closest('[role="dialog"]');
          const controls = [
            ...panel.querySelectorAll(
              "button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),summary,a[href]",
            ),
          ].filter((e) => e.getClientRects().length);
          const first = controls[0],
            last = controls.at(-1);
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
      >
        <div className="pl-companion-top">
          <div>
            <span className="pl-companion-badge">Guardian · Automatic</span>
            <strong>{guardianBotDisplayName(state.prefs)}</strong>
            <p>Automatic, rule-based help · No AI chat or conversations</p>
          </div>
          <button
            aria-label="Guardian settings"
            onClick={() => navigate("settings")}
          >
            ⚙
          </button>
        </div>
        {page !== "guardian" && (
          <button
            className="pl-companion-back"
            onClick={() => navigate("guardian")}
          >
            ‹ Back to my Guardian
          </button>
        )}
        {page === "guardian" && (
          <>
            <section className="pl-companion-hero">
              <div>
                <h2>Guardian</h2>
                <p>
                  {state.prefs.phrases ||
                    "Gentle reminders, routines, check-ins and encouragement — even without a human Guardian."}
                </p>
              </div>
              <img
                src="./assets/plushlife-mascot.svg"
                width="90"
                height="90"
                alt="Your Plush"
              />
            </section>
            <section className="pl-virtual-guardian-options" aria-label="Automatic Guardian">
              <h3>{guardianBotDisplayName(state.prefs)}</h3>
              {state.prefs.automaticReminders ? <>
                <p role="status">{botPlan.encouragement}</p>
                <p>{botPlan.completed} of {botPlan.total} little jobs complete today. You can pause or change your Guardian anytime.</p>
                {botPlan.next && <button onClick={() => { setTaskKey(botPlan.next.key); navigate("start"); }}>Help me do: {botPlan.next.label} ›</button>}
                <button onClick={() => navigate("routines")}>Routines ›</button>
                <button onClick={() => navigate("rewards")}>🎁 Rewards ›</button>
                {guardianSuggestedReward(botPlan.completed,botPlan.total,dailyCheckIn?.day_type === "rest") && <p>{guardianSuggestedReward(botPlan.completed,botPlan.total,dailyCheckIn?.day_type === "rest")}</p>}
                <button onClick={() => navigate("settings")}>My reminders & Guardian voice ›</button>
              </> : <>
                <p>Choose an automatic Guardian when no person is connected. Tasks, routines, encouragement and rewards are all here, without AI chat.</p>
                <button className="pl-companion-primary" onClick={() => update({ prefs: activateBotMommy(state.prefs) })}>Choose automatic Guardian 🧸</button>
                <button onClick={() => navigate("settings")}>Choose a different Guardian style ›</button>
              </>}
              <p>Automatic notifications require PlushLife notification permission. Quiet hours, rest days and your privacy choices still apply.</p>
            </section>
            <div className="pl-companion-choices">
              {[
                ["Comfort", "comfort"],
                ["Help me start", "start"],
                ["Plan my day", "plan"],
                ["Keep me company", "company"],
                ["I’m overwhelmed", "overwhelmed"],
              ].map(([label, id]) => (
                <button
                  key={id}
                  onClick={() => {
                    if (id === "comfort" || id === "company") {
                      offlineReply(id);
                      if (id === "company") {
                        navigate("routines");
                        offlineReply(id);
                      }
                    } else navigate(id);
                  }}
                >
                  {label}
                  <span aria-hidden="true"> ›</span>
                </button>
              ))}
            </div>
            <div className="pl-companion-grid">
              {[
                ["Brain dump", "inbox"],
                ["My routines", "routines"],
                ["My reflections", "reflections"],
                ["Personal rewards", "rewards"],
                ["Habit experiments", "experiments"],
                ["Letters to me", "letters"],
              ].map(([label, id]) => (
                <button key={id} onClick={() => navigate(id)}>
                  {label}
                </button>
              ))}
            </div>
            <button
              onClick={() => {
                onClose();
                startFocusTimer({ resume: true });
              }}
            >
              Resume my Focus session
            </button>
            <button onClick={() => navigate("settings")}>
              You choose what I remember
            </button>
            <button
              onClick={() => {
                onClose();
                props.onSupport?.();
              }}
            >
              Ask a human Guardian
            </button>
            <p className="pl-companion-note">
              This Guardian is an automatic routine helper, not a real person.
              You can invite someone you trust whenever you're ready.
            </p>
          </>
        )}
        {["start", "overwhelmed", "plan", "welcome"].includes(page) && (
          <section>
            <h2>
              {page === "welcome"
                ? "A gentle welcome back"
                : page === "overwhelmed"
                  ? "One moment at a time"
                  : page === "plan"
                    ? "Choose your next little step"
                    : "Help me start"}
            </h2>
            {page === "welcome" && (
              <p>
                Your history and unfinished tasks stay safe. You choose how
                today looks.
              </p>
            )}
            <label>
              Energy today
              <select
                value={state.energy}
                onChange={(e) => update({ energy: e.target.value })}
              >
                <option value="low">Low</option>
                <option value="some">Some</option>
                <option value="plenty">Plenty</option>
              </select>
            </label>
            {selected ? (
              <>
                <label>
                  One task
                  <select
                    value={selected.key}
                    onChange={(e) => {
                      setTaskKey(e.target.value);
                      setStep(0);
                    }}
                  >
                    {rows
                      .filter((r) => !r.isBonus)
                      .map((r) => (
                        <option key={r.key} value={r.key}>
                          {r.label}
                        </option>
                      ))}
                  </select>
                </label>
                <p className="pl-companion-badge">{effort(selected)}</p>
                <h3>{selected.label}</h3>
                {state.partial[selected.key]?.date === localDate() && (
                  <p>
                    You’ve taken {state.partial[selected.key].step} little{" "}
                    {state.partial[selected.key].step === 1 ? "step" : "steps"}{" "}
                    today.
                  </p>
                )}
                <p className="pl-companion-step">
                  {steps[Math.min(step, steps.length - 1)]}
                </p>
                <p>
                  Step {Math.min(step + 1, steps.length)} of {steps.length}
                </p>
                <button
                  onClick={() => {
                    update({
                      partial: {
                        ...state.partial,
                        [selected.key]: { date: localDate(), step: step + 1 },
                      },
                    });
                    setStep(Math.min(step + 1, steps.length - 1));
                  }}
                >
                  I did this little step
                </button>
                <button
                  onClick={() => {
                    onClose();
                    startFocusTimer({
                      minutes: 2,
                      taskLabel: selected.label,
                      step: steps[step],
                    });
                  }}
                >
                  Try two minutes
                </button>
                <button
                  onClick={() => setReview({ kind: "complete" })}
                  disabled={!!viewDone[selected.key]}
                >
                  My whole task is done
                </button>
                <details>
                  <summary>Edit my tiny steps</summary>
                  <textarea
                    aria-label="Tiny steps, one per line"
                    defaultValue={steps.join("\n")}
                    key={selected.key}
                    onBlur={(e) => {
                      const values = e.target.value
                        .split("\n")
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .slice(0, 10);
                      if (values.length)
                        update({
                          taskSteps: {
                            ...state.taskSteps,
                            [selected.key]: values,
                          },
                        });
                    }}
                  />
                </details>
                <button
                  onClick={() => {
                    setTaskKey(chooseTask(rows, viewDone, state.energy)?.key);
                    setStep(0);
                  }}
                >
                  Choose for me
                </button>
                <p>
                  Suggestion based on your selected energy and estimated task
                  time.
                </p>
                <button
                  onClick={() => {
                    onClose();
                    props.onEditTask?.(selected);
                  }}
                >
                  Move or edit this task
                </button>
                {review?.kind === "complete" && (
                  <div className="pl-companion-review">
                    <p>
                      Mark “{selected.label}” complete for the day you’re
                      viewing? Tiny steps alone don’t complete the whole task.
                    </p>
                    <button
                      disabled={busy}
                      onClick={() => action(() => props.toggle(selected.key))}
                    >
                      Confirm completion
                    </button>
                    <button onClick={() => setReview(null)}>Cancel</button>
                  </div>
                )}
              </>
            ) : (
              <p>
                Your list has room to breathe. Rest or start a saved routine.
              </p>
            )}
            <details>
              <summary>Make today smaller</summary>
              <p>
                Preview: change today’s pace to Tiny or Rest. Keep your tasks
                and completion history.
              </p>
              <button
                disabled={busy}
                onClick={() => action(() => props.onDayType("tiny"))}
              >
                Apply Tiny day
              </button>
              <button
                disabled={busy}
                onClick={() => action(() => props.onDayType("rest"))}
              >
                Apply Rest day
              </button>
            </details>
          </section>
        )}
        {[
          "inbox",
          "routines",
          "reflections",
          "letters",
          "rewards",
          "experiments",
        ].includes(page) && (
          <GuardianTools
            {...props}
            page={page}
            state={state}
            update={update}
            setMessage={setMessage}
            onClose={onClose}
          />
        )}
        {page === "settings" && (
          <GuardianSettings
            userId={user.id}
            state={state}
            update={update}
            onDeleteChat={() => update({ chat: [] })}
            onForget={() => {
              setReview(null);
              update({
                memories: [],
                chat: [],
                prefs: {
                  ...state.prefs,
                  remember: false,
                  shareMemories: false,
                  keepChat: false,
                  shareTasks: false,
                  shareMood: false,
                  aiConsent: false,
                },
              });
            }}
          />
        )}
        {message && (
          <p className="pl-companion-status" role="status">
            {message}
          </p>
        )}
      </div>
    </ToolPanel>
  );
}
