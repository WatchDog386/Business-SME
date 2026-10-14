import { useEffect, useState } from 'react';

export type Theme = 'light' | 'dark' | 'brand';

const STORAGE_KEY = 'biashara_theme';

const listeners = new Set<(theme: Theme) => void>();

/** Reads the saved theme from localStorage; defaults to dark. */
export function getTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark' || stored === 'brand') return stored as Theme;
  return 'dark';
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

/*
 * Phone status bar (theme-color). The opening splash keeps it blue; after that it
 * matches the page at the top edge, unless a full-screen loader overrides it.
 */
const SPLASH_BLUE = '#0033A1';
let pageStatusBar = SPLASH_BLUE;
let overrideStatusBar: string | null = null;

function splashShowing(): boolean {
  const splash = document.getElementById('splash-screen');
  return Boolean(splash) && !splash?.classList.contains('hidden');
}

function paintStatusBar(): void {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) return;
  if (splashShowing()) meta.content = SPLASH_BLUE;
  else meta.content = overrideStatusBar ?? pageStatusBar;
}

function setStatusBarColor(color: string): void {
  pageStatusBar = color;
  paintStatusBar();
}

/** Paints the status bar a given colour while a full-screen loader is shown. Returns a restore function. */
export function overrideStatusBarColor(color: string): () => void {
  overrideStatusBar = color;
  paintStatusBar();
  return () => {
    overrideStatusBar = null;
    paintStatusBar();
  };
}

if (typeof window !== 'undefined') {
  // index.html fires this once the opening splash has faded out
  window.addEventListener('splash-hidden', paintStatusBar);
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
  // Brand theme: show the savanna background image like the client dashboard
  if (theme === 'brand') {
    const docEl = document.documentElement;
    docEl.classList.add('page-white', 'dash-glow-body');
    // Savanna backdrop + gradient overlay – use data‑attribute to avoid CSS‑class selector bugs
    if (docEl.dataset?.brandBackdrop !== 'true') {
      const newImg = document.createElement('img');
      newImg.src = '/images/splash-savanna.jpg';
      newImg.setAttribute('aria-hidden', 'true');
      newImg.className = 'fixed inset-0 z-[-1] h-full w-full object-cover';
      docEl.appendChild(newImg);
      const newGrad = document.createElement('div');
      newGrad.className = 'fixed inset-0 z-[-1] bg-gradient-to-b from-black/70 via-black/45 to-black/75';
      docEl.appendChild(newGrad);
      docEl.dataset.brandBackdrop = 'true';
    }
  } else {
    // Remove brand background when switching away
    const docEl = document.documentElement;
    docEl.classList.remove('page-white', 'dash-glow-body');
    const img = docEl.querySelector<HTMLElement>('img[src="/images/splash-savanna.jpg"]');
    if (img) img.remove();
    const grad = docEl.querySelector<HTMLElement>('div.bg-gradient-to-b.from-black via-black to-black');
    if (grad) grad.remove();
    delete docEl.dataset.brandBackdrop;
  }
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