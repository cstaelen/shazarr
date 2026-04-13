import { ReactNode, useEffect, useRef, useState } from "react";
import { Preferences } from "@capacitor/preferences";

import { HISTORY_STORE_KEY } from "../../constant";

import { HistoryContext, HistoryItem } from "./context";

export type { HistoryItem } from "./context";

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<HistoryItem[]>();
  const initialized = useRef(false);

  useEffect(() => {
    Preferences.get({ key: HISTORY_STORE_KEY }).then(({ value }) => {
      setHistory(value ? JSON.parse(value) : []);
      initialized.current = true;
    });
  }, []);

  useEffect(() => {
    if (!initialized.current || history === undefined) return;
    Preferences.set({
      key: HISTORY_STORE_KEY,
      value: JSON.stringify(history),
    });
  }, [history]);

  function addItemToHistory(item: HistoryItem) {
    setHistory((prev) => [...(prev || []), item]);
  }

  function deleteHistoryItem(date: number) {
    setHistory((prev) => (prev || []).filter((item) => item.date !== date));
  }

  const value = {
    history,
    actions: {
      addItemToHistory,
      deleteHistoryItem,
    },
  };

  return (
    <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>
  );
}
