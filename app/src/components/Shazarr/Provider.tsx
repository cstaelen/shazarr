import { VoiceRecorder } from "capacitor-voice-recorder";
import { Haptics } from "@capacitor/haptics";
import React, { useContext, useState, ReactNode, useEffect } from "react";
import { recognize, getConfig } from "../../server/queryApi";
import {
  ShazamioResponseType,
  APIConfigType,
  ApiReturnType,
} from "../../types";
import { HistoryItem, useHistoryProvider } from "../History/Provider";
import { ErrorCodeType } from "../FormApi/errorCode";

export type RecordingStatusType = "start" | "searching" | "inactive";

export const RECORD_DURATION = 8000;

type ShazarrContextType = {
  config: APIConfigType | undefined;
  apiError: boolean | string;
  recordingError: ErrorCodeType | undefined;
  shazarrLoading: boolean;
  shazarrResponse: ShazamioResponseType | undefined;
  recordingStatus: RecordingStatusType;
  audio: string | undefined;
  actions: {
    setRecordingStatus: (status: RecordingStatusType) => void;
    setShazarrResponse: (data: ShazamioResponseType) => void;
    searchOfflineRecord: (item: HistoryItem) => void;
    resetSearch: () => void;
    fetchConfig: () => void;
  };
};

const ShazarrContext = React.createContext<ShazarrContextType>(
  {} as ShazarrContextType
);

export function ShazarrProvider({ children }: { children: ReactNode }) {
  const [audio, setAudio] = useState<string>();
  const [shazarrResponse, setShazarrResponse] =
    useState<ShazamioResponseType>();
  const [shazarrLoading, setShazarrLoading] = useState(false);
  const [apiError, setApiError] = useState<boolean | string>(false);
  const [recordingError, setRecordingError] = useState<ErrorCodeType>();
  const [recordingStatus, setRecordingStatus] =
    useState<RecordingStatusType>("inactive");
  const [config, setConfig] = useState<APIConfigType>();
  const [historySearch, setHistorySearch] = useState<string>();

  const {
    actions: { addItemToHistory, deleteHistoryItem },
  } = useHistoryProvider();

  const controller = new AbortController();
  const signal = controller.signal;

  const processRecording = async () => {
    setRecordingError(undefined);
    try {
      const { value: hasPerm } =
        await VoiceRecorder.hasAudioRecordingPermission();

      if (!hasPerm) {
        const { value: resultRequestPerm } =
          await VoiceRecorder.requestAudioRecordingPermission();

        if (resultRequestPerm) {
          processRecording();
          return;
        }
      }
      const { value: isRecording } = await VoiceRecorder.startRecording();
      if (isRecording) {
        setTimeout(async () => {
          const { status } = await VoiceRecorder.getCurrentStatus();
          if (recordingStatus !== "inactive" && status === "RECORDING") {
            const {
              value: { recordDataBase64 },
            } = await VoiceRecorder.stopRecording();
            setAudio(recordDataBase64);
            setRecordingStatus("searching");
          }
        }, RECORD_DURATION);
      }
    } catch (e: any) {
      resetSearch();
      setRecordingError(e.message);
    }
  };

  const recognizeRecording = async () => {
    setShazarrLoading(true);

    if (!audio || audio.length === 0) return;
    const response = await recognize(audio, signal);
    if ((response as ApiReturnType).error) {
      console.log("error", response);

      if (!historySearch) {
        addItemToHistory({
          title: "Offline record",
          artist: "Not discovered",
          date: Date.now(),
          stream: audio,
        });
      }

      setApiError(true);
      resetSearch();
    } else {
      const formatted = JSON.parse(response) as ShazamioResponseType;
      setShazarrResponse(formatted);
      setShazarrLoading(false);

      if (formatted.track) {
        await addItemToHistory({
          title: formatted.track.title,
          artist: formatted.track.subtitle,
          date: Date.now(),
          data: formatted?.track,
        });

        if (historySearch) {
          setHistorySearch(undefined);
          await deleteHistoryItem(historySearch);
        }
      }
    }
    setRecordingStatus("inactive");
  };

  const resetSearch = async () => {
    controller.abort();
    setShazarrResponse(undefined);
    setAudio(undefined);
    setRecordingStatus("inactive");
    setShazarrLoading(false);
    setHistorySearch(undefined);

    try {
      const { status } = await VoiceRecorder.getCurrentStatus();
      if (status === "RECORDING") {
        await VoiceRecorder.stopRecording();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const vibrateAction = async () => {
    await Haptics.vibrate();
  };

  const searchOfflineRecord = (item: HistoryItem) => {
    if (item?.stream) {
      resetSearch();
      setAudio(item.stream);
      setHistorySearch(item.date);
      setRecordingStatus("searching");
    }
  };

  const fetchConfig = async () => {
    setApiError(false);
    const response = await getConfig();
    if (response.error) {
      setApiError(true);
    }
    setConfig(response);
  };

  useEffect(() => {
    if (shazarrResponse) return;

    switch (recordingStatus) {
      case "start":
        vibrateAction();
        processRecording();
        break;
      case "searching":
        vibrateAction();
        if (audio) {
          recognizeRecording();
          vibrateAction();
        }
        break;
    }
  }, [recordingStatus]);

  useEffect(() => {
    if (config) return;
    fetchConfig();
  }, []);

  const value = {
    config,
    apiError,
    recordingError,
    shazarrLoading,
    shazarrResponse,
    recordingStatus,
    audio,
    actions: {
      setRecordingStatus,
      resetSearch,
      setShazarrResponse,
      searchOfflineRecord,
      fetchConfig,
    },
  };

  return (
    <ShazarrContext.Provider value={value}>{children}</ShazarrContext.Provider>
  );
}

export const useShazarrProvider = () => {
  return useContext(ShazarrContext);
};
