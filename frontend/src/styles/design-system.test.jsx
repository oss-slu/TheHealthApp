import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, THEME_STORAGE_KEY, THEMES, useTheme } from '../context/ThemeContext';

const tokensCss = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), 'tokens.css'),
  'utf8'
);

function ThemeProbe() {
  const { theme, setTheme, themes } = useTheme();
  return (
    <div>
      <span data-testid="current-theme">{theme}</span>
      <span data-testid="theme-count">{themes.length}</span>
      {themes.map((code) => (
        <button key={code} type="button" onClick={() => setTheme(code)}>
          set-{code}
        </button>
      ))}
    </div>
  );
}

describe('Design tokens', () => {
  it('defines brand, status, spacing, and typography CSS variables', () => {
    expect(tokensCss).toMatch(/--color-brand-600/);
    expect(tokensCss).toMatch(/--color-status-ok/);
    expect(tokensCss).toMatch(/--color-status-critical/);
    expect(tokensCss).toMatch(/--font-display/);
    expect(tokensCss).toMatch(/--font-sans/);
    expect(tokensCss).toMatch(/--spacing-section/);
    expect(tokensCss).toMatch(/--surface-canvas/);
    expect(tokensCss).toMatch(/\[data-theme="clinical"\]/);
    expect(tokensCss).toMatch(/\[data-theme="grove"\]/);
  });

  it('maps health status utilities to token colors', () => {
    expect(tokensCss).toMatch(/\.status-ok/);
    expect(tokensCss).toMatch(/\.status-warn/);
    expect(tokensCss).toMatch(/\.status-risk/);
    expect(tokensCss).toMatch(/\.status-critical/);
    expect(tokensCss).toMatch(/\.status-info/);
  });
});

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-theme');
  });

  it('applies default calm theme to document', async () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    );

    expect(screen.getByTestId('current-theme')).toHaveTextContent('calm');
    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('calm');
    });
  });

  it('switches theme without hard-coded page colors', async () => {
    const user = userEvent.setup();
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    );

    await user.click(screen.getByRole('button', { name: 'set-clinical' }));

    await waitFor(() => {
      expect(document.documentElement.getAttribute('data-theme')).toBe('clinical');
    });
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe('clinical');
    expect(THEMES).toContain('grove');
  });
});
