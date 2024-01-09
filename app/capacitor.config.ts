import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.shazarr.app',
  appName: 'shazarr-app',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  }
};

export default config;
