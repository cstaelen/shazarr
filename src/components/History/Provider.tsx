import React, { useContext, useState, ReactNode, useEffect } from "react";
import { Preferences } from "@capacitor/preferences";
import { HISTORY_STORE_KEY } from "../../constant";
import { ShazamTrack } from "shazam-api/dist/types";

type HistoryContextType = {
  history: HistoryItem[] | undefined;
  actions: {
    addItemToHistory: (item: HistoryItem) => void;
    deleteHistoryItem: (date: number) => void;
  };
};

export type HistoryItem = {
  title: string;
  artist: string;
  date: number;
  data?: ShazamTrack;
  stream?: string;
};

const HistoryContext = React.createContext<HistoryContextType>(
  {} as HistoryContextType,
);

export function HistoryProvider({ children }: { children: ReactNode }) {
  const [history, setHistory] = useState<HistoryItem[]>();

  function addItemToHistory(item: HistoryItem) {
    setHistory([...(history || []), item]);
  }

  function deleteHistoryItem(date: number) {
    const clone = [...(history || [])].filter((item) => item.date !== date);
    setHistory([...clone]);
  }

  async function getStorageHistory() {
    const { value } = await Preferences.get({
      key: HISTORY_STORE_KEY,
    });
    if (value) {
      setHistory(JSON.parse(value));
    }
  }

  async function setStorageHistory(history: HistoryItem[]) {
    await Preferences.set({
      key: HISTORY_STORE_KEY,
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
