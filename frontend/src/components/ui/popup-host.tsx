import { useEffect, useState } from 'react';
import { PopupMessage } from './popup-message';

type Kind = 'success' | 'error';

interface Popup {
  id: number;
  kind: Kind;
  title: string;
  message?: string;
}

/** How long a popup stays on screen before it closes itself. */
const AUTO_CLOSE_MS = 3200;

let nextId = 0;
const listeners = new Set<(popup: Popup) => void>();

function emit(kind: Kind, title: string, message?: string) {
  const popup: Popup = { id: ++nextId, kind, title, message };
  listeners.forEach((fn) => fn(popup));
}

/** Shows a success popup, styled like the Log Out confirmation. */
export function notifySuccess(title: string, message?: string) {
  emit('success', title, message);
}

/** Shows an error popup, styled like the Log Out confirmation. */
export function notifyError(title: string, message?: string) {
  emit('error', title, message);
}

/**
 * Mounted once in App. Holds whichever popup is showing and closes it after a
 * few seconds. Call notifySuccess / notifyError from anywhere to raise one.
 */
export function PopupHost() {
  const [current, setCurrent] = useState<Popup | null>(null);

  useEffect(() => {
    const onPopup = (popup: Popup) => setCurrent(popup);
    listeners.add(onPopup);
    return () => {
      listeners.delete(onPopup);
    };
  }, []);

  useEffect(() => {
    if (!current) return;
    const timer = window.setTimeout(() => setCurrent(null), AUTO_CLOSE_MS);
    return () => window.clearTimeout(timer);
  }, [current]);

  return (
    <PopupMessage
      isOpen={current != null}
      type={current?.kind ?? 'success'}
      title={current?.title ?? ''}
      message={current?.message}
      onClose={() => setCurrent(null)}
    />
  );
}