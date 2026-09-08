import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kenyasme.platform',
  appName: 'OmniTrack',
  webDir: 'dist',
  splashScreen: {
    launchShowDuration: 0,
    backgroundColor: '#FFFFFF',
    androidSplashResourceName: 'splash',
    androidScaleType: 'CENTER_CROP',
    showSpinner: false,
  },
};

export default config;
