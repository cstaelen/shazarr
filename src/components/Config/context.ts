import { createContext } from "react";

export type ConfigStoreType = {
  lidarr_url: string;
  lidarr_api_key: string;
  tidarr_url: string;
  tidarr_api_key: string;
  custom_service_url: string;
  custom_service_name: string;
  auto_listen_on_launch: boolean;
};

type storeKeysType = keyof ConfigStoreType;

export type ConfigFieldsType = {
  [key in storeKeysType]: {
    value: ConfigStoreType[key] | null;
    placeholder: string;
    type: "text" | "url" | "checkbox";
  };
};

type ConfigContextType = {
  config?: ConfigStoreType | null;
  formConfig?: ConfigFieldsType;
  isNetworkConnected: boolean;
  actions: {
    setConfig: (config: ConfigStoreType) => void;
  };
};

export const ConfigContext = createContext<ConfigContextType>(
  {} as ConfigContextType,
);
