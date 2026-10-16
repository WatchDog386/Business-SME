import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

export type Theme = 'dark' | 'brand';

const STORAGE_KEY = 'biashara_theme';

const listeners = new Set<(theme: Theme) => void>();

/** Reads the saved theme from localStorage; defaults to dark. */
export function getTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === 'dark' || stored === 'brand') return stored as Theme;
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

/** True when a #RRGGBB colour is dark enough to need light status bar icons. */
function isDarkColor(hex: string): boolean {
  const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(hex);
  if (!m) return true;
  const [r, g, b] = m.slice(1).map((c) => parseInt(c, 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b < 0.5;
}

let nativeIconsLight: boolean | null = null;

function paintStatusBar(): void {
  const color = splashShowing() ? SPLASH_BLUE : (overrideStatusBar ?? pageStatusBar);
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) meta.content = color;
  // The Android app draws the page behind the status bar: keep its clock and
  // battery icons readable against whatever colour is at the top
  if (Capacitor.isNativePlatform()) {
    const light = isDarkColor(color);
    if (light !== nativeIconsLight) {
      nativeIconsLight = light;
      void StatusBar.setStyle({ style: light ? Style.Dark : Style.Light }).catch(() => undefined);
    }
  }
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
  const docEl = document.documentElement;
  // Remove backdrops left in the DOM by older dashboard theme code. Theme
  // selection should only switch colors; route-specific photos live in-page.
  docEl.classList.remove('page-white', 'dash-glow-body');
  for (const child of Array.from(docEl.children)) {
    if (child instanceof HTMLImageElement && child.getAttribute('src') === '/images/splash-savanna.jpg') {
      child.remove();
    } else if (
      child instanceof HTMLDivElement &&
      child.className.includes('bg-gradient-to-b') &&
      child.className.includes('from-black/70') &&
      child.className.includes('via-black/45') &&
      child.className.includes('to-black/75')
    ) {
      child.remove();
    }
  }
  delete docEl.dataset.brandBackdrop;

  // Force light on home / auth / success pages — dark mode never applies there.
  if (isLightOnlyRoute(path)) {
    document.documentElement.classList.remove('dark');
    setStatusBarColor('#FFFFFF');
    return;
  }
  const dark = theme === 'dark';
  docEl.classList.toggle('dark', dark);
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
