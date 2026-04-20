import { ReactNode, useCallback, useEffect, useState } from "react";
import { Haptics } from "@capacitor/haptics";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { VoiceRecorder } from "capacitor-voice-recorder";
import { Shazam } from "shazam-api";
import { ShazamRoot, ShazamTrack } from "shazam-api/dist/types";

import { RECORD_DURATION } from "../../constant";
import { useConfigProvider } from "../Config/useConfig";
import { useHistoryProvider } from "../History/useHistory";

import { mockRecordBase64 } from "./mock/recordBase64";
import { RecordingStatusType, ShazarrContext } from "./context";
import { transcodePCM16 } from "./utils";

export type { RecordingStatusType } from "./context";

export function ShazarrProvider({ children }: { children: ReactNode }) {
  const [audio, setAudio] = useState<string>();
  const [shazarrResponse, setShazarrResponse] = useState<ShazamTrack>();
  const [shazarrLoading, setShazarrLoading] = useState(false);
  const [recordingError, setRecordingError] = useState<
    ReturnType<typeof useConfigProvider>["isNetworkConnected"] extends boolean
      ? never
      : never
  >();
  const [recordingStatus, setRecordingStatus] =
    useState<RecordingStatusType>("inactive");
  const [historySearch, setHistorySearch] = useState<number>();
  const [cleanHistorySearch, setCleanHistorySearch] = useState<number>();

  const { isNetworkConnected } = useConfigProvider();
  const {
    actions: { addItemToHistory, deleteHistoryItem },
  } = useHistoryProvider();

  const vibrateAction = async () => {
    try {
      await Haptics.vibrate();
    } catch (err) {
      console.error(err);
    }
  };

  const resetSearch = useCallback(async () => {
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
  }, []);

  const processRecording = useCallback(
    async (duration: number = RECORD_DURATION) => {
      setRecordingError(undefined);
      try {
        const { value: hasPerm } =
          await VoiceRecorder.hasAudioRecordingPermission();

        if (!hasPerm) {
          const { value: resultRequestPerm } =
            await VoiceRecorder.requestAudioRecordingPermission();

          if (!resultRequestPerm) return;
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
        if (import.meta.env.VITE_STAGE === "testing") {
          setAudio(mockRecordBase64);
          setRecordingStatus("searching");
          return;
        }
        resetSearch();
        setRecordingError("ERROR_RECORDING" as never);
      }
    },
    [recordingStatus, resetSearch],
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
              setCleanHistorySearch(historySearch);
            }
          } else {
            setShazarrResponse(undefined);
            setRecordingError("SHAZARR_NOT_FOUND" as never);
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
          setRecordingError("SHAZAM_API_ERROR" as never);
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

  const searchOfflineRecord = (item: Parameters<typeof addItemToHistory>[0]) => {
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
        // eslint-disable-next-line react-hooks/set-state-in-effect
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
