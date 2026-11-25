import { createContext } from "react";
import { ShazamTrack } from "shazam-api/dist/types";

export type SentService = "lidarr" | "tidarr" | "soulsync";

export const SENT_SERVICE_LABELS: Record<SentService, string> = {
  lidarr: "Lidarr",
  tidarr: "Tidarr",
  soulsync: "SoulSync",
};

export type HistoryItem = {
  title: string;
  artist: string;
  date: number;
  data?: ShazamTrack;
  stream?: string;
  previousDates?: number[];
  // Services Shazarr handed the song to, and when. It records what Shazarr did,
  // not what the service still holds.
  sentTo?: Partial<Record<SentService, number>>;
};

export function isRequested(item: HistoryItem) {
  return Object.keys(item.sentTo || {}).length > 0;
}

type HistoryContextType = {
  history: HistoryItem[] | undefined;
  actions: {
    addItemToHistory: (item: HistoryItem) => void;
    deleteHistoryItem: (date: number) => void;
    markItemAsSent: (date: number, service: SentService) => void;
  };
};

export const HistoryContext = createContext<HistoryContextType>({} as HistoryContextType);
