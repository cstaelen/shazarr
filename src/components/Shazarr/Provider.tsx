import React, {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { Haptics } from "@capacitor/haptics";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { VoiceRecorder } from "capacitor-voice-recorder";
import { Shazam } from "shazam-api";
import { ShazamRoot, ShazamTrack } from "shazam-api/dist/types";

import { RECORD_DURATION } from "../../constant";
import { ErrorCodeType } from "../Config/errorCode";
import { useConfigProvider } from "../Config/Provider";
import { HistoryItem, useHistoryProvider } from "../History/Provider";

import { mockRecordBase64 } from "./mock/recordBase64";
import { transcodePCM16 } from "./utils";

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

const ShazarrContext = React.createContext<ShazarrContextType>(
  {} as ShazarrContextType,
);

export function ShazarrProvider({ children }: { children: ReactNode }) {
  const [audio, setAudio] = useState<string>();
  const [shazarrResponse, setShazarrResponse] = useState<ShazamTrack>();
  const [shazarrLoading, setShazarrLoading] = useState(false);
  const [recordingError, setRecordingError] = useState<ErrorCodeType>();
  const [recordingStatus, setRecordingStatus] =
    useState<RecordingStatusType>("inactive");

  const [historySearch, setHistorySearch] = useState<number>();
  // Use state mutation to delete old offline records
  const [cleanHistorySearch, setCleanHistorySearch] = useState<number>();

  const { isNetworkConnected } = useConfigProvider();
  const {
    actions: { addItemToHistory, deleteHistoryItem },
  } = useHistoryProvider();

  const processRecording = useCallback(
    async (duration: number = RECORD_DURATION) => {
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

        setRecordingStatus("recording");
        vibrateAction();
        const { value: isRecording } = await VoiceRecorder.startRecording();

        if (isRecording) {
          setTimeout(async () => {
            const { status } = await VoiceRecorder.getCurrentStatus();
            if (recordingStatus !== "inactive" && status === "RECORDING") {
              const {
                value: { recordDataBase64 },
              } = await VoiceRecorder.stopRecording();

              // CI testing mock (with mic interface)
              if (import.meta.env.VITE_STAGE === "testing") {
                setAudio(mockRecordBase64);
              } else {
                setAudio(recordDataBase64);
              }

              setRecordingStatus("searching");
              await vibrateAction();
            }
          }, duration);
        }
      } catch (err) {
        console.error(err);
        // CI testing mock (no mic interface)
        if (import.meta.env.VITE_STAGE === "testing") {
          setAudio(mockRecordBase64);
          setRecordingStatus("searching");
          return;
        }
        resetSearch();
        setRecordingError("ERROR_RECORDING");
      }
    },
    [recordingStatus],
  );

  const processShazam = useCallback(
    async (samples: number[]) => {
      const shazam = new Shazam();

      shazam
        .fullRecognizeSong(samples)
        .then((value: ShazamRoot | null) => {
          const response = value?.track;
          if (response?.title && recordingStatus !== "inactive") {
            setShazarrResponse(response);

            addItemToHistory({
              title: response.title,
              artist: response.subtitle,
              date: Date.now(),
              data: response,
            });

            if (historySearch) {
              // Use state to not override previous "add" action mutation
              setCleanHistorySearch(historySearch);
            }
          } else {
            setShazarrResponse(undefined);
            setRecordingError("SHAZARR_NOT_FOUND");
          }
        })
        .catch((err) => {
          console.error(err);
          if (!historySearch) {
            addItemToHistory({
              title: "Offline record",
              artist: "Not discovered",
              date: Date.now(),
              stream: audio,
            });
          }
          setRecordingError("SHAZAM_API_ERROR");
        })
        .finally(async () => {
          await vibrateAction();
          await ScreenOrientation.unlock();
          setRecordingStatus("inactive");
          setShazarrLoading(false);
        });
    },
    [addItemToHistory, audio, historySearch, recordingStatus],
  );

  const processTranscoding = useCallback(() => {
    setShazarrLoading(true);

    if (!audio || audio.length === 0) return;

    if (!isNetworkConnected && !historySearch) {
      addItemToHistory({
        title: "Offline record",
        artist: "Not discovered",
        date: Date.now(),
        stream: audio,
      });
      vibrateAction();
      setRecordingStatus("inactive");
      setShazarrLoading(false);
    } else {
      transcodePCM16(audio).then((pcm16) => {
        if (recordingStatus !== "inactive") {
          processShazam(pcm16);
        }
      });
    }
  }, [
    addItemToHistory,
    audio,
    historySearch,
    isNetworkConnected,
    processShazam,
    recordingStatus,
  ]);

  const resetSearch = async () => {
    setShazarrResponse(undefined);
    setAudio(undefined);
    setRecordingStatus("inactive");
    setShazarrLoading(false);
    setHistorySearch(undefined);

    await ScreenOrientation.unlock();

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
    try {
      await Haptics.vibrate();
    } catch (err) {
      console.error(err);
    }
  };

  const searchOfflineRecord = (item: HistoryItem) => {
    if (item?.stream) {
      resetSearch();
      setAudio(item.stream);
      setHistorySearch(item.date);
      setRecordingStatus("searching");
    }
  };

  useEffect(() => {
    if (shazarrResponse) return;

    switch (recordingStatus) {
      case "start":
        processRecording();
        break;
      case "searching":
        if (audio) {
          processTranscoding();
        }
        break;
    }
  }, [
    audio,
    processRecording,
    processTranscoding,
    recordingStatus,
    shazarrResponse,
  ]);

  useEffect(() => {
    if (cleanHistorySearch) {
      deleteHistoryItem(cleanHistorySearch);
    }
  }, [cleanHistorySearch, deleteHistoryItem]);

  const value = {
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
    },
  };

  return (
    <ShazarrContext.Provider value={value}>{children}</ShazarrContext.Provider>
  );
}

export const useShazarrProvider = () => {
  return useContext(ShazarrContext);
};
