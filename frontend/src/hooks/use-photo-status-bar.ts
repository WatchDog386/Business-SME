import { useEffect } from 'react';
import { overrideStatusBarColor } from '@/lib/theme';

/** Colour of the top edge of /images/splash-savanna.jpg. */
const PHOTO_TOP = '#6583C2';

/**
 * Full-screen photo pages (home, login, help). The Android app already draws
 * every page edge to edge, so the photo runs up behind the status bar and the
 * icons turn light to match. Browsers can't draw under the bar, so it is
 * painted the photo's top colour to look continuous.
 */
export function usePhotoStatusBar(enabled = true): void {
  useEffect(() => {
    if (!enabled) return;
    return overrideStatusBarColor(PHOTO_TOP);
  }, [enabled]);
}
