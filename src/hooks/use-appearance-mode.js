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
    // Both system bars need contrasting icons on Android's transparent chrome.
    // StatusBar DARK means a dark background with light icons, not dark icons.
    try {
      const plugins = window.Capacitor?.Plugins;
      const style = darkMode ? "DARK" : "LIGHT";
      if (plugins?.SystemBars?.setStyle) plugins.SystemBars.setStyle({ style }).catch(() => {});
      if (plugins?.StatusBar?.setStyle) plugins.StatusBar.setStyle({ style }).catch(() => {});
    } catch (_error) {}
  }, [darkMode]);
}
