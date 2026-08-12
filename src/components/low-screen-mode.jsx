const HABIT_STATE_KEY = "plushlife:habit-coach:v1";
const RETENTION_KEY = "__retention";

function readLowScreenMode() {
  try {
    const state = JSON.parse(localStorage.getItem(HABIT_STATE_KEY) || "{}") || {};
    return !!state?.meta?.[RETENTION_KEY]?.lowScreen;
  } catch (_error) {
    return false;
  }
}

export function useLowScreenMode() {
  const [lowScreen, setLowScreen] = React.useState(() => readLowScreenMode());
  React.useEffect(() => {
    const refresh = () => setLowScreen(readLowScreenMode());
    window.addEventListener("plushlife:habit-coach-updated", refresh);
    window.addEventListener("plushlife:habit-coach-hydrated", refresh);
    return () => {
      window.removeEventListener("plushlife:habit-coach-updated", refresh);
      window.removeEventListener("plushlife:habit-coach-hydrated", refresh);
    };
  }, []);
  return lowScreen;
}
