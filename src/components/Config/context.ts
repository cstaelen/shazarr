import { createContext } from "react";

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
