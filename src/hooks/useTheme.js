import { useCallback, useEffect, useState } from 'react';

/**
 * Light/dark theme with three states: 'light', 'dark', or 'system' (no explicit
 * override — follows the OS). Persisted to localStorage and applied by stamping
 * `data-theme` on <html>, which the CSS tokens key off.
 */
const KEY = 'adviser-theme';

function apply(theme) {
  const root = document.documentElement;
  if (theme === 'system') root.removeAttribute('data-theme');
  else root.setAttribute('data-theme', theme);
}

export function useTheme() {
  const [theme, setTheme] = useState(() => localStorage.getItem(KEY) || 'system');

  useEffect(() => {
    apply(theme);
    localStorage.setItem(KEY, theme);
  }, [theme]);

  // Reflect the effective mode (resolving 'system' against the OS preference).
  const resolved =
    theme === 'system'
      ? window.matchMedia?.('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light'
      : theme;

  const toggle = useCallback(() => {
    setTheme((t) => {
      const current =
        t === 'system'
          ? window.matchMedia?.('(prefers-color-scheme: dark)').matches
            ? 'dark'
            : 'light'
          : t;
      return current === 'dark' ? 'light' : 'dark';
    });
  }, []);

  return { theme, resolved, setTheme, toggle };
}
