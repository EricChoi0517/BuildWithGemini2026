import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lumos.voicejournal.app',
  appName: 'Lumos',
  webDir: 'dist',
  server: {
    // During development, point to your Vite dev server:
    // url: 'http://YOUR_LOCAL_IP:3000',
    // cleartext: true,
  },
  ios: {
    backgroundColor: '#0A0A0F',
    contentInset: 'automatic',
    preferredContentMode: 'mobile',
  },
  plugins: {
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0A0A0F',
    },
    SplashScreen: {
      launchAutoHide: true,
      backgroundColor: '#0A0A0F',
      showSpinner: false,
    },
  },
};

export default config;
