import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'biashara_theme';

/** Dark mode disabled — app stays in original light design. */
const DARK_ROUTES: string[] = [];

const listeners = new Set<(theme: Theme) => void>();

export function getTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'dark' ? 'dark' : 'light';
}

function isDarkAllowed(pathname: string): boolean {
  return DARK_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}

export function applyTheme(
  theme: Theme,
  pathname: string = window.location.pathname,
): void {
  document.documentElement.classList.toggle(
    'dark',
    theme === 'dark' && isDarkAllowed(pathname),
  );
}

export function setTheme(theme: Theme): void {
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
  listeners.forEach((fn) => fn(theme));
}

export function initTheme(): void {
  applyTheme(getTheme());
}

/** Reactive theme state — stays in sync across every toggle in the app. */
export function useTheme(): [Theme, (theme: Theme) => void] {
  const [theme, setThemeState] = useState<Theme>(getTheme);

  useEffect(() => {
    listeners.add(setThemeState);
    return () => {
      listeners.delete(setThemeState);
    };
  }, []);

  return [theme, setTheme];
}
