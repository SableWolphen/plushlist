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
  buildGuardianPayload,
} from "../plush-guardian-model.mjs";
import { GuardianTools } from "./plush-guardian-tools.jsx";
import { GuardianSettings } from "./plush-guardian-settings.jsx";
import { startFocusTimer } from "./focus-timer.jsx";
export default function PlushGuardianCore(props) {
  const {
    user,
    rows = [],
    viewDone = {},
    dailyCheckIn = {},
    client,
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
  const [input, setInput] = React.useState("");
  const [journal, setJournal] = React.useState("");
  const [chat, setChat] = React.useState(() =>
    state.prefs.keepChat ? state.chat : [],
  );
  const [review, setReview] = React.useState(null);
  const [step, setStep] = React.useState(0);
  const abort = React.useRef(null);
  const alive = React.useRef(true);
  React.useEffect(
    () => () => {
      alive.current = false;
      abort.current?.abort();
    },
    [],
  );
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
  React.useEffect(() => {
    if (!state.prefs.aiConsent) {
      abort.current?.abort();
      setReview(null);
    }
    if (!state.prefs.keepChat && state.chat.length) update({ chat: [] });
  }, [state.prefs.aiConsent, state.prefs.keepChat]);
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
  const ask = async () => {
    if (busy || !input.trim() || !state.prefs.aiConsent) return;
    const messages = [
      ...chat,
      { role: "user", content: input.trim().slice(0, 1200) },
    ];
    const payload = buildGuardianPayload(
      state,
      messages,
      rows,
      viewDone,
      dailyCheckIn,
      journal,
    );
    setReview(payload);
  };
  const send = async () => {
    if (!review || busy) return;
    setBusy(true);
    setMessage("");
    const controller = new AbortController();
    abort.current = controller;
    const timer = setTimeout(() => controller.abort(), 25000);
    try {
      const { data, error } = await client.auth.getSession();
      if (error || data?.session?.user?.id !== user.id)
        throw Error("Please sign in again to chat.");
      const response = await fetch(
        "https://plushlife.plushlife-app.workers.dev/api/plush-guardian",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.session.access_token}`,
          },
          body: JSON.stringify(review),
          signal: controller.signal,
        },
      );
      const body = await response.json();
      if (!response.ok)
        throw Error(
          body.error || "Chat is unavailable. Your offline tools still work.",
        );
      if (
        !alive.current ||
        controller.signal.aborted ||
        !ref.current.prefs.aiConsent
      )
        return;
      const next = [
        ...review.messages,
        { role: "assistant", content: String(body.reply) },
      ].slice(-24);
      setChat(next);
      setInput("");
      setJournal("");
      setReview(null);
      if (ref.current.prefs.keepChat) update({ chat: next });
    } catch (error) {
      if (alive.current)
        setMessage(
          error.name === "AbortError"
            ? "Chat took too long. Your message is still here; try again or use offline support."
            : error.message,
        );
    } finally {
      clearTimeout(timer);
      if (alive.current) setBusy(false);
    }
  };
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
            <span className="pl-companion-badge">
              {VOICES[state.prefs.voice]} · {state.prefs.guidance}
            </span>
            <p>Optional AI companion · Offline tools always available</p>
          </div>
          <button
            aria-label="Companion settings"
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
            ‹ Back to my companion
          </button>
        )}
        {page === "guardian" && (
          <>
            <section className="pl-companion-hero">
              <div>
                <h2>What would help right now?</h2>
                <p>
                  {state.prefs.phrases ||
                    "A little kindness, a small plan, or company while you begin."}
                </p>
              </div>
              <img
                src="./assets/plushlife-mascot.svg"
                width="90"
                height="90"
                alt="Your Plush"
              />
            </section>
            <section className="pl-virtual-guardian-options" aria-label="Automatic companion status">
              <h3>Virtual Guardian reminders</h3>
              <p>{state.prefs.automaticReminders ? "On — your chosen Guardian voice is used when app notifications are enabled." : "Off — your Plush can give gentle reminders without needing a conversation."}</p>
              <button onClick={() => navigate("settings")}>Set up my reminders ›</button>
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
            <details>
              <summary>Talk with my AI companion</summary>
              <p>
                Chat uses Cloudflare Workers AI. It can make mistakes and does
                not monitor emergencies. Only messages and context shown in your
                send preview leave your device.
              </p>
              {!state.prefs.aiConsent ? (
                <button
                  onClick={() =>
                    update({ prefs: { ...state.prefs, aiConsent: true } })
                  }
                >
                  Enable AI chat with Cloudflare
                </button>
              ) : (
                <>
                  <div className="pl-companion-chat" aria-live="polite">
                    {chat.map((m, i) => (
                      <p key={i} className={m.role}>
                        <strong>
                          {m.role === "user" ? "You" : "Plush Guardian"}
                        </strong>
                        <span>{m.content}</span>
                      </p>
                    ))}
                  </div>
                  <label>
                    Your message
                    <textarea
                      value={input}
                      maxLength={1200}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Tell me what you need…"
                    />
                  </label>
                  <details>
                    <summary>Include one journal excerpt (optional)</summary>
                    <p>
                      Nothing from your journal is included automatically. Paste
                      only what you want to send this time.
                    </p>
                    <textarea
                      aria-label="Journal excerpt to share this time"
                      value={journal}
                      maxLength={1200}
                      onChange={(e) => setJournal(e.target.value)}
                    />
                  </details>
                  <button disabled={busy || !input.trim()} onClick={ask}>
                    Review before sending
                  </button>
                  {review?.consent && (
                    <section className="pl-companion-review">
                      <h3>Send preview</h3>
                      <p>
                        {review.messages.length} messages from this
                        conversation, your chosen voice and boundaries.
                      </p>
                      <p>
                        Tasks: {review.context.tasks.join(", ") || "None"}
                        <br />
                        Mood: {review.context.mood || "None"}
                        <br />
                        Memories: {review.context.memories.join("; ") || "None"}
                        <br />
                        Journal excerpt: {review.context.journal || "None"}
                      </p>
                      <button disabled={busy} onClick={send}>
                        {busy ? "Thinking…" : "Send to Plush Guardian"}
                      </button>
                      <button disabled={busy} onClick={() => setReview(null)}>
                        Cancel
                      </button>
                    </section>
                  )}
                  <button
                    onClick={() => {
                      abort.current?.abort();
                      setChat([]);
                      setReview(null);
                      update({ chat: [] });
                    }}
                  >
                    Delete conversation
                  </button>
                </>
              )}
            </details>
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
              You can close this whenever you’re ready. A real person or
              professional can offer support this companion cannot.
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
            state={state}
            update={update}
            onDeleteChat={() => {
              abort.current?.abort();
              setChat([]);
              setReview(null);
              update({ chat: [] });
            }}
            onForget={() => {
              abort.current?.abort();
              setChat([]);
              setReview(null);
              setJournal("");
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
