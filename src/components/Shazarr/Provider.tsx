import { VoiceRecorder } from "capacitor-voice-recorder";
import { Haptics } from "@capacitor/haptics";
import React, { useContext, useState, ReactNode, useEffect } from "react";
import { ShazamioResponseType, ShazamioTrackType } from "../../types";
import { HistoryItem, useHistoryProvider } from "../History/Provider";
import { ErrorCodeType } from "../Config/errorCode";
import { RECORD_DURATION } from "../../constant";
import { Shazam, s16LEToSamplesArray } from "shazam-api";
import { useConfigProvider } from "../Config/Provider";
import { b64toBlob, ffmpegTranscode } from "./utils";

export type RecordingStatusType =
  | "start"
  | "recording"
  | "searching"
  | "inactive";

type ShazarrContextType = {
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
  const [historySearch, setHistorySearch] = useState<string>();

  const { isNetworkConnected } = useConfigProvider();
  const {
    actions: { addItemToHistory, deleteHistoryItem },
  } = useHistoryProvider();

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

            setAudio(recordDataBase64);
            setRecordingStatus("searching");
            vibrateAction();
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

    if (!isNetworkConnected && !historySearch) {
      addItemToHistory({
        title: "Offline record",
        artist: "Not discovered",
        date: Date.now(),
        stream: audio,
      });
    } else {
      const blob = b64toBlob(audio);

      let arrayBuffer: ArrayBuffer;
      const fileReader = new FileReader();
      fileReader.onload = async function (event: ProgressEvent<FileReader>) {
        if (event?.target?.result) {
          arrayBuffer = event.target.result as ArrayBuffer;

          const rawSamples = await ffmpegTranscode(
            arrayBuffer,
            "wav",
            "-ar 16000 -ac 1 -f s16le"
          );

          processShazam(rawSamples);
        }
      };

      fileReader.readAsArrayBuffer(blob);
    }
  };

  async function processShazam(rawSamples: Uint8Array) {
    const shazam = new Shazam();
    const samples = s16LEToSamplesArray(rawSamples);

    try {
      const response = (await shazam.recognizeSong(
        samples
      )) as any as ShazamioTrackType;

      if (response?.title && recordingStatus !== "inactive") {
        setShazarrResponse({ track: response });

        addItemToHistory({
          title: response.title,
          artist: response.subtitle,
          date: Date.now(),
          data: response,
        });
        if (historySearch) {
          deleteHistoryItem(historySearch);
        }
      } else {
        setShazarrResponse({} as ShazamioResponseType);
      }

      vibrateAction();
      setRecordingStatus("inactive");
      setShazarrLoading(false);
    } catch (e: any) {
      setApiError("SHAZAM_API_ERROR");
    }
  }

  const resetSearch = async () => {
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

  useEffect(() => {
    if (shazarrResponse) return;

    switch (recordingStatus) {
      case "start":
        processRecording();
        break;
      case "searching":
        if (audio) {
          recognizeRecording();
        }
        break;
    }
  }, [recordingStatus]);

  const value = {
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
    },
  };

  return (
    <ShazarrContext.Provider value={value}>{children}</ShazarrContext.Provider>
  );
}

export const useShazarrProvider = () => {
  return useContext(ShazarrContext);
};
