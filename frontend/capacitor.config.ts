import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kenyasme.platform',
  appName: 'OmniTrack',
  webDir: 'dist',
  // The app opens the live site, so it always talks to the current backend
  // (through Vercel's /api rewrite) and picks up every update without a new APK
  server: {
    url: 'https://business-sme.vercel.app',
    androidScheme: 'https',
  },
  plugins: {
    // MainActivity draws the app edge to edge on every Android version and
    // passes the real bar heights to the page (--safe-area-inset-*). Capacitor's
    // own handling would instead shrink the app below the status bar on phones
    // with an older WebView, leaving an empty strip above the home page photo.
    SystemBars: {
      insetsHandling: 'disable',
    },
  },
  splashScreen: {
    launchShowDuration: 0,
    backgroundColor: '#0033A1',
    androidSplashResourceName: 'splash',
    androidScaleType: 'CENTER_CROP',
    showSpinner: false,
  },
};

export default config;
