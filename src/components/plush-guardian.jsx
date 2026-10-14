import {
  GUARDIAN_EVENT,
  STATE_EVENT,
  guardianStorage,
  readGuardian,
  saveGuardian,
  localDate,
  gapDays,
  inQuietHours,
  openPlushGuardian,
} from "../plush-guardian-model.mjs";
import { botGuardianName } from "../guardian-bot.mjs";
export { openPlushGuardian };
class GuardianBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div role="alert" className="pl-companion-loading">
        Your Bot Guardian couldn’t open. Your tasks are still available.
        <button onClick={this.props.onClose}>Close</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
const Core = React.lazy(() => import("./plush-guardian-core.jsx"));
export function useGuardianState(userId) {
  const [state, setState] = React.useState(() =>
    readGuardian(guardianStorage(), userId),
  );
  React.useEffect(() => {
    const refresh = () => setState(readGuardian(guardianStorage(), userId));
    refresh();
    window.addEventListener?.(STATE_EVENT, refresh);
    window.addEventListener?.("storage", refresh);
    return () => {
      window.removeEventListener?.(STATE_EVENT, refresh);
      window.removeEventListener?.("storage", refresh);
    };
  }, [userId]);
  return state;
}
export function PlushGuardianHost(props) {
  const [request, setRequest] = React.useState(null);
  const state = useGuardianState(props.user?.id);
  React.useEffect(() => {
    setRequest(null);
    const open = (e) => {
      if (!props.guardianLinksReady || props.humanGuardianConnected) return;
      setRequest({
        page: e.detail?.page || "guardian",
        taskKey: e.detail?.taskKey || null,
        id: Date.now(),
      });
    };
    window.addEventListener(GUARDIAN_EVENT, open);
    return () => window.removeEventListener(GUARDIAN_EVENT, open);
  }, [props.user?.id, props.guardianLinksReady, props.humanGuardianConnected]);
  React.useEffect(() => {
    if (!props.user?.id) return;
    document.documentElement.dataset.plCompanionMotion = state.prefs.motion
      ? "on"
      : "off";
    document.documentElement.dataset.plCompanionText = state.prefs.textSize;
    return () => {
      delete document.documentElement.dataset.plCompanionMotion;
      delete document.documentElement.dataset.plCompanionText;
    };
  }, [props.user?.id, state.prefs.motion, state.prefs.textSize]);
  // A newly accepted person immediately closes the automatic Guardian panel.
  if (!props.user || !request || !props.guardianLinksReady || props.humanGuardianConnected) return null;
  return (
    <GuardianBoundary key={props.user.id} onClose={() => setRequest(null)}>
      <React.Suspense
        fallback={
          <div className="pl-companion-loading" role="status">
            Opening your Guardian…{" "}
            <button onClick={() => setRequest(null)}>Close</button>
          </div>
        }
      >
        <Core
          key={props.user.id}
          {...props}
          request={request}
          onClose={() => setRequest(null)}
        />
      </React.Suspense>
    </GuardianBoundary>
  );
}
export function CompanionHomeCard({ userId }) {
  const state = useGuardianState(userId);
  const [gap, setGap] = React.useState(() =>
    gapDays(state.lastVisit, localDate()),
  );
  React.useEffect(() => {
    if (!userId) return;
    const s = readGuardian(guardianStorage(), userId);
    setGap(gapDays(s.lastVisit, localDate()));
    if (
      s.lastVisit !== localDate() &&
      saveGuardian(guardianStorage(), userId, { ...s, lastVisit: localDate() })
    )
      window.dispatchEvent(new Event(STATE_EVENT));
  }, [userId]);
  const reminder = state.prefs.reminders && !inQuietHours(state.prefs);
  return (
    <section className="pl-companion-home">
      <img
        src="./assets/plushlife-mascot.svg"
        width="68"
        height="68"
        alt="Your Plush"
      />
      <div>
        <strong>
          {gap >= 3
            ? "Welcome back, Cozy"
            : state.activeRoutine
              ? "Your routine is waiting"
              : state.prefs.automaticReminders ? `${botGuardianName(state.prefs.voice)} is ready` : "A little support for your day"}
        </strong>
        <p>
          {gap >= 3
            ? "Start with one manageable step. Your history stays safe."
            : reminder
              ? "A gentle check-in, whenever you’re ready."
              : state.prefs.automaticReminders ? "Your chosen reminder times are ready." : "Your pace. Your choices."}
        </p>
        <button
          onClick={() =>
            openPlushGuardian(
              gap >= 3
                ? "welcome"
                : state.activeRoutine
                  ? "routines"
                  : "guardian",
            )
          }
        >
          {gap >= 3
            ? "Choose a fresh start"
            : state.activeRoutine
              ? "Continue my routine"
              : state.prefs.automaticReminders ? `My ${botGuardianName(state.prefs.voice)}` : "Meet Bot Mommy"}{" "}
          ›
        </button>
        <div className="pl-companion-home-shortcuts">
          <button onClick={() => openPlushGuardian("inbox")}>Brain dump</button>
          <button onClick={() => openPlushGuardian("routines")}>
            My routines
          </button>
        </div>
      </div>
    </section>
  );
}
