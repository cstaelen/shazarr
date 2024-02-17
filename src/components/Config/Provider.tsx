import { Preferences } from "@capacitor/preferences";
import React, { useContext, useState, ReactNode, useEffect } from "react";
import { SHAZARR_STORE_KEY, SHAZARR_LOGS_KEY } from "../../constant";
import { Network } from "@capacitor/network";
import { usePrevious } from "@uidotdev/usehooks";
import { LocalNotifications } from "@capacitor/local-notifications";

type ConfigContextType = {
  config?: ConfigStoreType | null;
  formConfig?: ConfigFieldsType;
  isNetworkConnected: boolean;
  isDebugMode: boolean;
  logs: string[] | null;
  actions: {
    setConfig: (config: ConfigStoreType) => void;
    addToLogs: (log: string) => void;
    clearLogs: () => void;
    setIsDebugMode: (isDebugMode: boolean) => void;
  };
};

export type ConfigStoreType = {
  lidarr_url: string;
  lidarr_api_key: string;
  lidarr_library_path: string;
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
  const [isDebugMode, setIsDebugMode] = useState<boolean>(false);
  const [logs, setLogs] = useState<string[] | null>(null);

  const configPrevious = usePrevious(config);
  const logsPrevious = usePrevious(logs);

  async function loadConfig() {
    const store = await getStorageValue(SHAZARR_STORE_KEY);

    let storeData: ConfigStoreType = {} as ConfigStoreType;
    if (store && store !== "undefined") {
      storeData = JSON.parse(store);
    }

    setConfig(storeData);
  }

  async function loadLogs() {
    const store = await getStorageValue(SHAZARR_LOGS_KEY);

    let logsData: string[] = [];
    if (store && store !== "undefined") {
      logsData = JSON.parse(store);
    }

    setLogs(logsData);
  }

  function loadForm() {
    if (!config) return null;

    const formFields: ConfigFieldsType = {
      lidarr_url: {
        value: config?.lidarr_url,
        placeholder: "Lidarr URL (http://...)",
        type: "url",
      },
      lidarr_api_key: {
        value: config?.lidarr_api_key,
        placeholder: "Lidarr api key ...",
        type: "text",
      },
      lidarr_library_path: {
        value: config?.lidarr_library_path,
        placeholder: "Lidarr music path (/music/)",
        type: "text",
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
  }

  async function getStorageValue(key: string) {
    const { value } = await Preferences.get({
      key: key,
    });

    return value;
  }

  async function setStorageValue(key: string, value: string) {
    if (!value) return;
    await Preferences.set({ key: key, value: value });
    loadForm();
  }

  async function logCurrentNetworkStatus() {
    const status = await Network.getStatus();
    setIsNetworkConnected(status.connected);
  }

  async function checkForUpdates() {
    if (process.env.REACT_APP_CURRENT_VERSION) {
      try {
        const response = await fetch(
          `https://api.github.com/repos${process.env.REACT_APP_REPO_API_URL}/releases`,
        );
        const data = await response.json();
        const latestVersion = data[0].tag_name.substring(
          1,
          data[0].tag_name.length,
        );
        const currentVersion = process.env.REACT_APP_CURRENT_VERSION.substring(
          1,
          data[0].tag_name.length,
        );
        if (
          latestVersion !== currentVersion &&
          latestVersion > currentVersion
        ) {
          sendNotification();
        }
      } catch (e) {
        console.log("fetch github issue", e);
      }
    }
  }

  async function sendNotification() {
    let allowed = false;

    const { display: currentPerm } =
      await LocalNotifications.checkPermissions();

    if (currentPerm !== "granted") {
      const { display: requestStatus } =
        await LocalNotifications.requestPermissions();
      console.log("requestStatus", requestStatus);
      if (requestStatus === "granted") {
        allowed = true;
      }
    } else {
      allowed = true;
    }

    if (!allowed) return;

    LocalNotifications.addListener("localNotificationActionPerformed", () => {
      window.open(
        `https://github.com${process.env.REACT_APP_REPO_API_URL}/releases`,
      );
    });
    LocalNotifications.schedule({
      notifications: [
        {
          title: "Update available !",
          body: "A new version of Shazarr is available. Download it on github.",
          id: 1,
          largeIcon: "ic_stat_name/ic_stat_name",
          smallIcon: "ic_stat_name/ic_stat_name",
          schedule: { at: new Date(Date.now() + 500) },
        },
      ],
    });
  }

  function addToLogs(log: string) {
    if (!isDebugMode) return;
    const data = [...(logs || []), log];
    setLogs(data);
  }

  function clearLogs() {
    setLogs(null);
  }

  useEffect(() => {
    if (config !== configPrevious) {
      setStorageValue(SHAZARR_STORE_KEY, JSON.stringify(config));
    }
  }, [config, configPrevious]);

  useEffect(() => {
    if (logs !== logsPrevious) {
      setStorageValue(SHAZARR_LOGS_KEY, JSON.stringify(logs));
    }
  }, [logs, logsPrevious]);

  useEffect(() => {
    checkForUpdates();
    loadConfig();
    loadLogs();
    logCurrentNetworkStatus();
  }, []);

  const value = {
    config,
    formConfig,
    isNetworkConnected,
    isDebugMode,
    logs,
    actions: {
      setConfig,
      addToLogs,
      clearLogs,
      setIsDebugMode,
    },
  };

  return (
    <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>
  );
}

export const useConfigProvider = () => {
  return useContext(ConfigContext);
};
