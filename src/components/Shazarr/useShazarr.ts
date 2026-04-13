import { useContext } from "react";

import { ShazarrContext } from "./context";

export const useShazarrProvider = () => {
  return useContext(ShazarrContext);
};
