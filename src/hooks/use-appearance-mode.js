// Mirror the existing preference for startup, browser chrome and native controls.
export function useAppearanceMode(darkMode) {
  React.useEffect(() => {
    const mode = darkMode ? "dark" : "light";
    try { window.localStorage.setItem("plushlife:appearance-mode:v1", mode); } catch (_error) {}
    document.documentElement.dataset.plushlifeColorMode = mode;
    document.documentElement.dataset.plushlifeColorModePreference = mode;
    document.documentElement.style.colorScheme = mode;
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute("content", mode === "dark" ? "#21182c" : "#b75acb");
  }, [darkMode]);
}
