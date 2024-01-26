import React, { useContext, useState, ReactNode, useEffect } from "react";
import { ShazamioTrackType } from "../../types";
import { Preferences } from "@capacitor/preferences";

type HistoryContextType = {
  history: HistoryItem[] | undefined;
  actions: {
    addItemToHistory: any;
    deleteHistoryItem: (date: string) => void;
  };
};

export type HistoryItem = {
  title: string;
  artist: string;
  date: string;
  data?: ShazamioTrackType;
  stream?: string;
};

const HistoryContext = React.createContext<HistoryContextType>(
  {} as HistoryContextType
);

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<HistoryItem[]>();

  function addItemToHistory(item: HistoryItem) {
    setHistory([...(history || []), item]);
  }

  function deleteHistoryItem(date: string) {
    const clone = [...(history || [])].filter((item) => item.date !== date);
    setHistory([...clone]);
  }

  async function getStorageHistory() {
    const { value } = await Preferences.get({
      key: "shazarr_history",
    });
    if (value) {
      setHistory(JSON.parse(value));
    }
  }

  async function setStorageHistory(history: HistoryItem[]) {
    await Preferences.set({
      key: "shazarr_history",
      value: JSON.stringify(history),
    });
  }

  useEffect(() => {
    if (!history) {
      getStorageHistory();
    } else {
      setStorageHistory(history);
    }
  }, [history]);

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

export const useHistoryProvider = () => {
  return useContext(HistoryContext);
};
