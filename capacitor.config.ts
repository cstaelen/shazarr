import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.shazarr.app",
  appName: "Shazarr",
  webDir: "dist",
  android: {
    allowMixedContent: true,
  },
  ios: {
    scheme: "Shazarr",
  },
  server: {
    cleartext: true,
    androidScheme: "https",
    iosScheme: "https",
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
