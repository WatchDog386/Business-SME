import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { overrideStatusBarColor } from '@/lib/theme';

/** Colour of the top edge of /images/splash-savanna.jpg, so the browser status bar blends into the photo. */
const PHOTO_TOP = '#FDFDFD';

/**
 * Lets the full-screen photo on the home and login pages run up behind the status bar.
 * - Android app: transparent status bar with light icons; the photo shows through.
 * - Browser / installed web app: the page can't draw under the status bar there,
 *   so the bar is painted the photo's top colour to look continuous.
 */
export function usePhotoStatusBar(enabled = true): void {
  useEffect(() => {
    if (!enabled) return;
    const native = Capacitor.isNativePlatform();
    const restoreThemeColor = overrideStatusBarColor(native ? '#00000000' : PHOTO_TOP);
    if (!native) return restoreThemeColor;

    void (async () => {
      try {
        await StatusBar.setOverlaysWebView({ overlay: true });
        await StatusBar.setBackgroundColor({ color: '#00000000' });
        await StatusBar.setStyle({ style: Style.Dark });
      } catch {
        /* status bar plugin unavailable */
      }
    })();

    return () => {
      restoreThemeColor();
      void StatusBar.setOverlaysWebView({ overlay: false }).catch(() => {});
      void StatusBar.setStyle({ style: Style.Light }).catch(() => {});
    };
  }, [enabled]);
}
