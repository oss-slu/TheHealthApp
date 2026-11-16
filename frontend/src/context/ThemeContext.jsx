import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { THEME_STORAGE_KEY, THEMES, ThemeContext, readStoredTheme } from './theme';

export function ThemeProvider({ children, initialTheme }) {
  const [theme, setThemeState] = useState(() => initialTheme || readStoredTheme());

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* Ignore unavailable storage. */
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

export default ThemeProvider;
