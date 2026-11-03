import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export const THEME_STORAGE_KEY = 'app.theme';
export const THEMES = ['calm', 'clinical', 'grove'];

const ThemeContext = createContext({
  theme: 'calm',
  themes: THEMES,
  setTheme: () => {},
});

function readStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (THEMES.includes(stored)) return stored;
  } catch {
    /* ignore */
  }
  return 'calm';
}

export function ThemeProvider({ children, initialTheme }) {
  const [theme, setThemeState] = useState(() => initialTheme || readStoredTheme());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const setTheme = useCallback((next) => {
    if (THEMES.includes(next)) {
      setThemeState(next);
    }
  }, []);

  const value = useMemo(
    () => ({
      theme,
      themes: THEMES,
      setTheme,
    }),
    [theme, setTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeContext;
