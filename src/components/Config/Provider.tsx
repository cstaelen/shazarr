import React, {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Network } from "@capacitor/network";
import { Preferences } from "@capacitor/preferences";
import { usePrevious } from "@uidotdev/usehooks";

import { SHAZARR_STORE_KEY } from "../../constant";

type ConfigContextType = {
  config?: ConfigStoreType | null;
  formConfig?: ConfigFieldsType;
  isNetworkConnected: boolean;
  actions: {
    setConfig: (config: ConfigStoreType) => void;
  };
};

export type ConfigStoreType = {
  lidarr_url: string;
  tidarr_url: string;
  custom_service_url: string;
  custom_service_name: string;
};

type storeKeysType = keyof ConfigStoreType;

export type ConfigFieldsType = {
  [key in storeKeysType]: {
    value: string | null;
    placeholder: string;
    type: "text" | "url";
  };
};

const ConfigContext = React.createContext<ConfigContextType>(
  {} as ConfigContextType,
);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ConfigStoreType | null>(null);
  const [formConfig, setFormConfig] = useState<ConfigFieldsType>();
  const [isNetworkConnected, setIsNetworkConnected] = useState<boolean>(false);

  const configPrevious = usePrevious(config);

  const loadConfig = useCallback(async () => {
    const store = await getStorageValue(SHAZARR_STORE_KEY);

    let storeData: ConfigStoreType = {} as ConfigStoreType;
    if (store && store !== "undefined") {
      storeData = JSON.parse(store);
    }

    setConfig(storeData);
  }, []);

  const loadForm = useCallback(() => {
    if (!config) return null;

    const formFields: ConfigFieldsType = {
      lidarr_url: {
        value: config?.lidarr_url,
        placeholder: "Lidarr URL (http://...)",
        type: "url",
      },
      tidarr_url: {
        value: config?.tidarr_url,
        placeholder: "Tidarr URL (http://...)",
        type: "url",
      },
      custom_service_url: {
        value: config?.custom_service_url,
        placeholder: "Custom service (http://...?query=)",
        type: "url",
      },
      custom_service_name: {
        value: config?.custom_service_name,
        placeholder: "Custom service name",
        type: "text",
      },
    };
    setFormConfig(formFields);
  }, [config]);

  async function getStorageValue(key: string) {
    const { value } = await Preferences.get({
      key: key,
    });

    return value;
  }

  const setStorageValue = useCallback(
    async (key: string, value: string) => {
      if (!value) return;
      await Preferences.set({ key: key, value: value });
      loadForm();
    },
    [loadForm],
  );

  async function logCurrentNetworkStatus() {
    const status = await Network.getStatus();
    setIsNetworkConnected(status.connected);
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
          title: `${prerelease ? "’[prerelease]" : ""} Update available !`,
          body: `A new ${prerelease ? "prerelease" : "version"} of Shazarr is available (${name}). Click to download it on Github.`,
          id: 1,
          largeIcon: "ic_stat_name/ic_stat_name",
          smallIcon: "ic_stat_name/ic_stat_name",
          schedule: { at: new Date(Date.now() + 500) },
        },
      ],
    });
  }

  useEffect(() => {
    if (config !== configPrevious) {
      setStorageValue(SHAZARR_STORE_KEY, JSON.stringify(config));
    }
  }, [config, configPrevious, setStorageValue]);

  useEffect(() => {
    checkForUpdates();
    loadConfig();
    logCurrentNetworkStatus();
    const logInterval = setInterval(() => logCurrentNetworkStatus(), 5000);

    return () => {
      clearInterval(logInterval);
    };
  }, [checkForUpdates, loadConfig]);

  const value = {
    config,
    formConfig,
    isNetworkConnected,
    actions: {
      setConfig,
    },
  };

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
}

export const useConfigProvider = () => {
  return useContext(ConfigContext);
};
