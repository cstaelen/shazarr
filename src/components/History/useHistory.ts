import { useContext } from "react";

import { HistoryContext } from "./context";

export const useHistoryProvider = () => {
  return useContext(HistoryContext);
};
