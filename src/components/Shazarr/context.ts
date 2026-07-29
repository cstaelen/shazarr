import { createContext } from "react";

import { ErrorCodeType } from "../Config/errorCode";
import { HistoryItem } from "../History/context";

export type RecordingStatusType = "recording" | "searching" | "inactive";

type ShazarrContextType = {
  recordingError: ErrorCodeType | undefined;
  shazarrLoading: boolean;
  showInlineResult: boolean;
  recordingStatus: RecordingStatusType;
  audio: string | undefined;
  openResultDate: number | undefined; // date of the history item whose detail panel is open, or undefined if none
  actions: {
    startRecording: () => void;
    searchOfflineRecord: (item: HistoryItem) => void;
    resetSearch: () => void;
    dismissInlineResult: () => void;
    setOpenResultDate: (date: number | undefined) => void;
  };
};

export const ShazarrContext = createContext<ShazarrContextType>(
  {} as ShazarrContextType,
);
