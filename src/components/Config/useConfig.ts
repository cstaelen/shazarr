import { useContext } from "react";

import { ConfigContext } from "./context";

export const useConfigProvider = () => {
  return useContext(ConfigContext);
};
