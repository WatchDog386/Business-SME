import { useCallback, useEffect, useState } from 'react';
import { notify } from '@/components/ui/popup-host';

/** The release this copy of the app was built from. Development has none. */
const BUILD = import.meta.env.PROD ? __APP_BUILD__ : '';
const CHECK_EVERY_MS = 2 * 60_000;
const SEEN_KEY = 'optimas.build';

async function newerBuildLive(): Promise<boolean> {
  const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' });
  if (!res.ok) return false;
  const latest = ((await res.json()) as { build?: string }).build;
  return Boolean(latest) && latest !== BUILD;
}

/**
 * Notices when a newer release has been deployed: on start, whenever the app
 * comes back to the front, and every couple of minutes. The installed app and
 * an open browser tab otherwise keep running the release they started with.
 */
export function useAppUpdate() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    if (!BUILD) return;
    let stopped = false;
    // The first time a new release opens on this device, say so
    try {
      const seen = localStorage.getItem(SEEN_KEY);
      if (seen && seen !== BUILD) {
        setTimeout(() => notify('success', 'Optimas updated', 'You are on the latest version.'), 1500);
      }
      localStorage.setItem(SEEN_KEY, BUILD);
    } catch {
      // Private browsing: nothing to compare with
    }
    const check = async () => {
      try {
        if (!stopped && (await newerBuildLive())) setAvailable(true);
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

  const apply = useCallback(async () => {
    try {
      const registration = await navigator.serviceWorker?.getRegistration();
      await registration?.update();
    } catch {
      // The reload below still loads the new release (pages are network-first)
    }
    window.location.reload();
  }, []);

  return { available, apply };
}
