import { ReactNode, useEffect, useRef, useState } from "react";
import { Preferences } from "@capacitor/preferences";

import { HISTORY_STORE_KEY } from "../../constant";

import { HistoryContext, HistoryItem, SentService } from "./context";

export type { HistoryItem, SentService } from "./context";

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

  function getTrackIdentity(item: HistoryItem) {
    return item.data?.key;
  }

  function addItemToHistory(item: HistoryItem) {
    setHistory((prev) => {
      const list = prev || [];
      const identity = getTrackIdentity(item);
      const existingIndex =
        identity === undefined
          ? -1
          : list.findIndex((existing) => getTrackIdentity(existing) === identity);

      if (existingIndex === -1) {
        return [...list, item];
      }

      const existing = list[existingIndex];
      const merged: HistoryItem = {
        ...item,
        previousDates: [existing.date, ...(existing.previousDates || [])],
        // Tagging a song again must not forget we already sent it
        sentTo: existing.sentTo,
      };

      return [...list.slice(0, existingIndex), ...list.slice(existingIndex + 1), merged];
    });
  }

  function markItemAsSent(date: number, service: SentService) {
    setHistory((prev) =>
      (prev || []).map((item) =>
        item.date === date ? { ...item, sentTo: { ...item.sentTo, [service]: Date.now() } } : item,
      ),
    );
  }

  function deleteHistoryItem(date: number) {
    setHistory((prev) => (prev || []).filter((item) => item.date !== date));
  }

  const value = {
    history,
    actions: {
      addItemToHistory,
      deleteHistoryItem,
      markItemAsSent,
    },
  };

  return <HistoryContext.Provider value={value}>{children}</HistoryContext.Provider>;
}
