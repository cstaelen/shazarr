import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.shazarr.app",
  appName: "Shazarr",
  webDir: "build",
  android: {
    allowMixedContent: true,
  },
  server: {
    cleartext: true,
    androidScheme: "https",
  },
  plugins: {
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
