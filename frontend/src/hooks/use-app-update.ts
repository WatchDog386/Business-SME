import { useCallback, useEffect, useState } from 'react';
import { notify } from '@/components/ui/popup-host';

/** The release this copy of the app was built from. Development has none. */
export const APP_BUILD = import.meta.env.PROD ? __APP_BUILD__ : '';

const CHECK_EVERY_MS = 2 * 60_000;
/** Just after opening nobody is in the middle of anything yet. */
const QUIET_START_MS = 8_000;
const SEEN_KEY = 'optimas.build';
/** The release this tab last reloaded for, so a failed switch can't loop. */
const TRIED_KEY = 'optimas.update.tried';
const startedAt = Date.now();

async function liveBuild(): Promise<string | null> {
  const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) return null;
  const build = ((await res.json()) as { build?: unknown }).build;
  return typeof build === 'string' && build ? build : null;
}

const read = (store: Storage, key: string) => {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
};
const write = (store: Storage, key: string, value: string) => {
  try {
    store.setItem(key, value);
  } catch {
    // Private browsing: carry on without it
  }
};

/** Loads the release the server is on now. */
async function switchTo(build: string) {
  write(sessionStorage, TRIED_KEY, build);
  try {
    const registration = await navigator.serviceWorker?.getRegistration();
    await registration?.update();
  } catch {
    // The reload below still asks the server for the page
  }
  window.location.reload();
}

/**
 * Keeps every phone and browser on the release the server is running. It looks
 * on start, whenever the app comes back to the front, and every two minutes.
 * Nobody signed in, or the app only just opened: it switches by itself.
 * Someone at work: it offers the switch and waits for a tap, so nothing being
 * typed is lost.
 */
export function useAppUpdate() {
  const [latest, setLatest] = useState<string | null>(null);

  useEffect(() => {
    if (!APP_BUILD) return;
    let stopped = false;
    // The first time a new release opens on this device, say so
    const seen = read(localStorage, SEEN_KEY);
    if (seen && seen !== APP_BUILD) {
      setTimeout(() => notify('success', 'Optimas updated', 'You are on the latest version.'), 1500);
    }
    write(localStorage, SEEN_KEY, APP_BUILD);

    const check = async () => {
      try {
        const build = await liveBuild();
        if (stopped || !build || build === APP_BUILD) return;
        const signedIn = Boolean(read(localStorage, 'ksa_token'));
        const justOpened = Date.now() - startedAt < QUIET_START_MS;
        const alreadyTried = read(sessionStorage, TRIED_KEY) === build;
        if (!alreadyTried && (!signedIn || justOpened)) await switchTo(build);
        else setLatest(build);
      } catch {
        // Offline: try again later
      }
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') void check();
    };
    void check();
    const timer = setInterval(check, CHECK_EVERY_MS);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('online', onVisible);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('online', onVisible);
    };
  }, []);

  const apply = useCallback(() => switchTo(latest ?? ''), [latest]);

  return { available: latest !== null, apply };
}
