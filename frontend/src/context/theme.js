import { createContext } from 'react';

export const THEME_STORAGE_KEY = 'app.theme';
export const THEMES = ['calm', 'clinical', 'grove'];

export const ThemeContext = createContext({
  theme: 'calm',
  themes: THEMES,
  setTheme: () => {},
});

export function readStoredTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (THEMES.includes(stored)) return stored;
  } catch {
    /* Ignore unavailable storage. */
  }
  return 'calm';
}
