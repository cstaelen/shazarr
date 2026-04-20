import { createContext } from "react";
import { ShazamTrack } from "shazam-api/dist/types";

import { ErrorCodeType } from "../Config/errorCode";
import { HistoryItem } from "../History/context";

export type RecordingStatusType =
  | "start"
  | "recording"
  | "searching"
  | "inactive";

type ShazarrContextType = {
  recordingError: ErrorCodeType | undefined;
  shazarrLoading: boolean;
  shazarrResponse: ShazamTrack | undefined;
  recordingStatus: RecordingStatusType;
  audio: string | undefined;
  actions: {
    setRecordingStatus: (status: RecordingStatusType) => void;
    setShazarrResponse: (data: ShazamTrack) => void;
    searchOfflineRecord: (item: HistoryItem) => void;
    resetSearch: () => void;
  };
};

export const ShazarrContext = createContext<ShazarrContextType>(
  {} as ShazarrContextType,
);
