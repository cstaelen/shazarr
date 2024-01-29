import { Preferences } from "@capacitor/preferences";
import React, { useContext, useState, ReactNode, useEffect } from "react";
import { SHAZARR_STORE_KEY } from "../../constant";
import { Network } from "@capacitor/network";
import { usePrevious } from "@uidotdev/usehooks";

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
  {} as ConfigContextType
);

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<ConfigStoreType | null>(null);
  const [formConfig, setFormConfig] = useState<ConfigFieldsType>();
  const [isNetworkConnected, setIsNetworkConnected] = useState<boolean>(false);

  const configPrevious = usePrevious(config);

  async function loadConfig() {
    const store = await getStorageValue(SHAZARR_STORE_KEY);

    let storeData: ConfigStoreType = {} as ConfigStoreType;
    if (store && store !== "undefined") {
      storeData = JSON.parse(store);
    }

    setConfig(storeData);
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

  useEffect(() => {
    if (config !== configPrevious) {
      setStorageValue(SHAZARR_STORE_KEY, JSON.stringify(config));
    }
  }, [config, configPrevious]);

  useEffect(() => {
    loadConfig();
    logCurrentNetworkStatus();
  }, []);

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
