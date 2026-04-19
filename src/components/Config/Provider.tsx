import { ReactNode, useCallback, useEffect, useState } from "react";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Network } from "@capacitor/network";
import { Preferences } from "@capacitor/preferences";

import { SHAZARR_STORE_KEY } from "../../constant";

import { ConfigContext, ConfigFieldsType,ConfigStoreType } from "./context";

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ConfigStoreType | null>(null);
  const [formConfig, setFormConfig] = useState<ConfigFieldsType>();
  const [isNetworkConnected, setIsNetworkConnected] = useState<boolean>(false);

  const loadForm = useCallback((currentConfig: ConfigStoreType) => {
    setFormConfig({
      lidarr_url: {
        value: currentConfig.lidarr_url,
        placeholder: "Lidarr URL (http://...)",
        type: "url",
      },
      lidarr_api_key: {
        value: currentConfig.lidarr_api_key,
        placeholder: "Lidarr API key (optional, enables auto-search)",
        type: "text",
      },
      tidarr_url: {
        value: currentConfig.tidarr_url,
        placeholder: "Tidarr URL (http://...)",
        type: "url",
      },
      tidarr_api_key: {
        value: currentConfig.tidarr_api_key,
        placeholder: "Tidarr API key (optional, enables auto-search)",
        type: "text",
      },
      custom_service_url: {
        value: currentConfig.custom_service_url,
        placeholder: "Custom service (http://...?query=)",
        type: "url",
      },
      custom_service_name: {
        value: currentConfig.custom_service_name,
        placeholder: "Custom service name",
        type: "text",
      },
    });
  }, []);

  const saveConfig = useCallback(
    async (newConfig: ConfigStoreType) => {
      setConfig(newConfig);
      await Preferences.set({
        key: SHAZARR_STORE_KEY,
        value: JSON.stringify(newConfig),
      });
      loadForm(newConfig);
    },
    [loadForm],
  );


  async function sendNotification(name: string, prerelease: boolean) {
    let allowed = false;

    const { display: currentPerm } =
      await LocalNotifications.checkPermissions();

    if (currentPerm !== "granted") {
      const { display: requestStatus } =
        await LocalNotifications.requestPermissions();

      if (requestStatus === "granted") {
        allowed = true;
      }
    } else {
      allowed = true;
    }

    if (!allowed) return;

    LocalNotifications.addListener("localNotificationActionPerformed", () => {
      window.open(
        `https://github.com${import.meta.env.VITE_REPO_API_URL}/releases`,
      );
    });
    LocalNotifications.schedule({
      notifications: [
        {
          title: `${prerelease ? "'[prerelease]" : ""} Update available !`,
          body: `A new ${prerelease ? "prerelease" : "version"} of Shazarr is available (${name}). Click to download it on Github.`,
          id: 1,
          largeIcon: "ic_stat_name/ic_stat_name",
          smallIcon: "ic_stat_name/ic_stat_name",
          schedule: { at: new Date(Date.now() + 500) },
        },
      ],
    });
  }

  const checkForUpdates = useCallback(async () => {
    if (import.meta.env.VITE_CURRENT_VERSION) {
      try {
        const response = await fetch(
          `https://api.github.com/repos${import.meta.env.VITE_REPO_API_URL}/releases`,
        );
        const data = await response.json();
        const latestVersion = data[0].tag_name.substring(
          1,
          data[0].tag_name.length,
        );
        const currentVersion = import.meta.env.VITE_CURRENT_VERSION.substring(
          1,
          data[0].tag_name.length,
        );
        if (
          latestVersion !== currentVersion &&
          latestVersion > currentVersion
        ) {
          sendNotification(data[0].tag_name, data[0].prerelease);
        }
      } catch (e) {
        console.log("fetch github issue", e);
      }
    }
  }, []);

  useEffect(() => {
    async function init() {
      const { value: store } = await Preferences.get({ key: SHAZARR_STORE_KEY });
      const storeData: ConfigStoreType =
        store && store !== "undefined"
          ? JSON.parse(store)
          : ({} as ConfigStoreType);
      setConfig(storeData);
      loadForm(storeData);
    }

    init();
    checkForUpdates();

    Network.getStatus().then(({ connected }) => setIsNetworkConnected(connected));
    const networkListener = Network.addListener("networkStatusChange", ({ connected }) => {
      setIsNetworkConnected(connected);
    });

    return () => {
      networkListener.then((handle) => handle.remove());
    };
  }, [checkForUpdates, loadForm]);

  const value = {
    config,
    formConfig,
    isNetworkConnected,
    actions: {
      setConfig: saveConfig,
    },
  };

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
}

