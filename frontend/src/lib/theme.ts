import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'biashara_theme';

const listeners = new Set<(theme: Theme) => void>();

/** Dark is the default on first open; a saved choice in Settings overrides it. */
export function getTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'light' ? 'light' : 'dark';
}

/** Routes that must always render in light mode, even when user prefers dark. */
export const LIGHT_ONLY_ROUTES = [
  '/',
  '/welcome',
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
] as const;

export function isLightOnlyRoute(pathname: string): boolean {
  return (LIGHT_ONLY_ROUTES as readonly string[]).includes(pathname);
}

/** Colours the phone status bar (theme-color) to match the page at the top edge. */
function setStatusBarColor(color: string): void {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = color;
}

export function applyTheme(theme: Theme): void {
  const path = typeof window !== 'undefined' ? window.location.pathname : '/';
  // Force light on home / auth / success pages — dark mode never applies there.
  if (isLightOnlyRoute(path)) {
    document.documentElement.classList.remove('dark');
    setStatusBarColor('#FFFFFF');
    return;
  }
  const dark = theme === 'dark';
  document.documentElement.classList.toggle('dark', dark);
  // Dashboard top is the sky glow (light) or the dark glow (dark); other pages use the plain page colour
  if (dark) setStatusBarColor(path === '/dashboard' ? '#16202F' : '#121212');
  else setStatusBarColor(path === '/dashboard' ? '#D7E7FF' : '#F8FAFC');
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
