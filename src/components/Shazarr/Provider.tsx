import { ReactNode, useState } from "react";
import { Haptics } from "@capacitor/haptics";
import { ScreenOrientation } from "@capacitor/screen-orientation";
import { VoiceRecorder } from "capacitor-voice-recorder";
import { Shazam } from "shazam-api";
import { ShazamRoot } from "shazam-api/dist/types";

import { RECORD_DURATION } from "../../constant";
import { ErrorCodeType } from "../Config/errorCode";
import { useConfigProvider } from "../Config/useConfig";
import { HistoryItem } from "../History/context";
import { useHistoryProvider } from "../History/useHistory";

import { mockRecordBase64 } from "./mock/recordBase64";
import { RecordingStatusType, ShazarrContext } from "./context";
import { transcodePCM16 } from "./utils";

export type { RecordingStatusType } from "./context";

export function ShazarrProvider({ children }: { children: ReactNode }) {
  const [audio, setAudio] = useState<string>();
  const [showInlineResult, setShowInlineResult] = useState(false);
  const [shazarrLoading, setShazarrLoading] = useState(false);
  const [recordingError, setRecordingError] = useState<ErrorCodeType | undefined>();
  const [recordingStatus, setRecordingStatus] =
    useState<RecordingStatusType>("inactive");

  const { isNetworkConnected } = useConfigProvider();

  const {
    actions: { addItemToHistory },
  } = useHistoryProvider();

  const vibrateAction = async () => {
    try {
      await Haptics.vibrate();
    } catch (err) {
      console.error(err);
    }
  };

  const dismissInlineResult = () => {
    setShowInlineResult(false);
  };

  const resetSearch = async () => {
    setShowInlineResult(false);
    setAudio(undefined);
    setRecordingStatus("inactive");
    setShazarrLoading(false);

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


  function handleTesting(date: number) {
    const audioData = mockRecordBase64;
    setAudio(audioData);
    if (!isNetworkConnected) {
      addItemToHistory({
        title: "Offline record",
        artist: "Not discovered",
        date: date,
        stream: audioData,
      });
      setRecordingStatus("inactive");
      return;
    }
    setRecordingStatus("searching");
    processTranscoding(audioData);
  }

  const processShazam = async (samples: number[]) => {
    const shazam = new Shazam();

    shazam
      .fullRecognizeSong(samples)
      .then((value: ShazamRoot | null) => {
        console.log("shazarr:", value);
        const response = value?.track;
        if (response?.title) {
          addItemToHistory({
            title: response.title,
            artist: response.subtitle,
            date: Date.now(),
            data: response,
          });
          setShowInlineResult(true);
        } else {
          setRecordingError("SHAZARR_NOT_FOUND" as never);
        }
      })
      .catch((err) => {
        console.error("shazarr:", err);
        setRecordingError("SHAZAM_API_ERROR" as never);
      })
      .finally(async () => {
        await vibrateAction();
        await ScreenOrientation.unlock();
        setRecordingStatus("inactive");
        setShazarrLoading(false);
      });
  };

  const processTranscoding = (recordDataBase64: string) => {
    setShazarrLoading(true);
    transcodePCM16(recordDataBase64).then((pcm16) => {
      processShazam(pcm16);
    });
  };

  const startRecording = async (duration: number = RECORD_DURATION) => {
    setRecordingError(undefined);
    try {
      const { value: hasPerm } =
        await VoiceRecorder.hasAudioRecordingPermission();

      if (!hasPerm) {
        const { value: resultRequestPerm } =
          await VoiceRecorder.requestAudioRecordingPermission();

        if (!resultRequestPerm) return;
      }

      vibrateAction();
      setRecordingStatus("recording");

      const { value: isRecording } = await VoiceRecorder.startRecording();

      if (isRecording) {
        setTimeout(async () => {
          const {
            value: { recordDataBase64 },
          } = await VoiceRecorder.stopRecording();

          const audioData = import.meta.env.VITE_STAGE === "testing"
            ? mockRecordBase64
            : recordDataBase64;

          if (!audioData) return;

          setAudio(audioData);
          setRecordingStatus("searching");
          await vibrateAction();

          if (!isNetworkConnected) {
            addItemToHistory({
              title: "Offline record",
              artist: "Not discovered",
              date: Date.now(),
              stream: audioData,
            });
            setRecordingStatus("inactive");
            return;
          }

          processTranscoding(audioData);
        
        }, duration);
      }
    } catch (err) {
      console.error(err);

      if (import.meta.env.VITE_STAGE === "testing") {
        handleTesting(Date.now());
        return;
      };

      resetSearch();
      setRecordingError("ERROR_RECORDING" as never);
    };
  };

  const searchOfflineRecord = (item: HistoryItem) => {
    if (!item?.stream) return;
    
    resetSearch();
    setAudio(item.stream);
    setRecordingStatus("searching");
    processTranscoding(item.stream);
  };

  const value = {
    recordingError,
    shazarrLoading,
    showInlineResult,
    recordingStatus,
    audio,
    actions: {
      startRecording,
      resetSearch,
      dismissInlineResult,
      searchOfflineRecord,
    },
  };

  return (
    <ShazarrContext.Provider value={value}>{children}</ShazarrContext.Provider>
  );
}
