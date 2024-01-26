import { Preferences } from "@capacitor/preferences";
import React, { useContext, useState, ReactNode, useEffect } from "react";
import { SHAZARR_STORE_KEY } from "../../constant";
import { Network } from "@capacitor/network";

type ConfigContextType = {
  config?: ConfigStoreType;
  formConfig?: ConfigFieldsType;
  isNetworkConnected: boolean;
  actions: {
    setConfig: (config: ConfigStoreType) => void;
  };
};

export type ConfigStoreType = {
  lidarr_url: string;
  lidarr_api_key: string;
  lidarr_library_path: string;
  tidarr_url: string;
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
  {} as ConfigContextType
);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ConfigStoreType>();
  const [formConfig, setFormConfig] = useState<ConfigFieldsType>();
  const [isNetworkConnected, setIsNetworkConnected] = useState<boolean>(false);

  async function loadConfig() {
    const store = await getStorageValue(SHAZARR_STORE_KEY);
    const storeData: ConfigStoreType = JSON.parse(store || "{}");

    const formFields: ConfigFieldsType = {
      lidarr_url: {
        value: storeData?.lidarr_url,
        placeholder: "Lidarr URL (http://...)",
        type: "url",
      },
      lidarr_api_key: {
        value: storeData?.lidarr_api_key,
        placeholder: "Lidarr api key ...",
        type: "text",
      },
      lidarr_library_path: {
        value: storeData?.lidarr_library_path,
        placeholder: "Lidarr music path (/music/)",
        type: "text",
      },
      tidarr_url: {
        value: storeData?.tidarr_url,
        placeholder: "Tidarr URL (http://...)",
        type: "url",
      },
    };

    setConfig(storeData);
    setFormConfig(formFields);
  }

  async function getStorageValue(key: string) {
    const { value } = await Preferences.get({
      key: key,
    });

    return value;
  }

  async function setStorageValue(key: string, value: string) {
    await Preferences.set({ key: key, value: value });
  }

  async function logCurrentNetworkStatus() {
    const status = await Network.getStatus();
    setIsNetworkConnected(status.connected);
  }

  useEffect(() => {
    if (config) {
      setStorageValue(SHAZARR_STORE_KEY, JSON.stringify(config));
    }
  }, [config]);

  useEffect(() => {
    loadConfig();
    logCurrentNetworkStatus();
  });

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
