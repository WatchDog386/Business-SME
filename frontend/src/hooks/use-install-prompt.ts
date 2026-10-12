import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// The browser fires this once per page load, possibly before React mounts
let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferred = e as BeforeInstallPromptEvent;
    listeners.forEach((fn) => fn());
  });
  window.addEventListener('appinstalled', () => {
    deferred = null;
    listeners.forEach((fn) => fn());
  });
}

/** Offers "Install app" when the browser allows installing Optimas (Chrome/Edge, Android). */
export function useInstallPrompt() {
  const [canInstall, setCanInstall] = useState(Boolean(deferred));

  useEffect(() => {
    const update = () => setCanInstall(Boolean(deferred));
    listeners.add(update);
    return () => {
      listeners.delete(update);
    };
  }, []);

  const install = async () => {
    if (!deferred) return;
    await deferred.prompt();
    await deferred.userChoice;
    deferred = null;
    setCanInstall(false);
  };

  return { canInstall, install };
}
