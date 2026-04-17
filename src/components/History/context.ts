import { createContext } from "react";
import { ShazamTrack } from "shazam-api/dist/types";

export type HistoryItem = {
  title: string;
  artist: string;
  date: number;
  data?: ShazamTrack;
  stream?: string;
};

type HistoryContextType = {
  history: HistoryItem[] | undefined;
  actions: {
    addItemToHistory: (item: HistoryItem) => void;
    deleteHistoryItem: (date: number) => void;
  };
};

export const HistoryContext = createContext<HistoryContextType>(
  {} as HistoryContextType,
);
