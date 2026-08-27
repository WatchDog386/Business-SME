import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'biashara_theme';

const listeners = new Set<(theme: Theme) => void>();

export function getTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'dark' ? 'dark' : 'light';
}

/** Routes that must always render in light mode, even when user prefers dark. */
export const LIGHT_ONLY_ROUTES = [
  '/',
  '/splash',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/auth-success',
] as const;

export function isLightOnlyRoute(pathname: string): boolean {
  return (LIGHT_ONLY_ROUTES as readonly string[]).includes(pathname);
}

export function applyTheme(theme: Theme): void {
  // Force light on splash / auth / success pages — dark mode never applies there.
  if (typeof window !== 'undefined' && isLightOnlyRoute(window.location.pathname)) {
    document.documentElement.classList.remove('dark');
    return;
  }
  document.documentElement.classList.toggle('dark', theme === 'dark');
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
