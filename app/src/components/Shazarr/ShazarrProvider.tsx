import { Haptics } from "@capacitor/haptics";
import React, {
  useContext,
  useState,
  ReactNode,
  useEffect,
  useRef,
} from "react";
import { recognize, getConfig } from "../../server/queryApi";
import {
  ShazamioResponseType,
  APIConfigType,
  ApiReturnType,
} from "../../types";
import { HistoryItem, useHistoryProvider } from "../History/HistoryProvider";

export type RecordingStatusType =
  | "start"
  | "granted"
  | "recording"
  | "searching"
  | "inactive";


export const RECORD_DURATION = 8000;

const SHAZARR_MIME_TYPE = "audio/webm";

type ShazarrContextType = {
  config: APIConfigType | undefined;
  apiError: boolean;
  shazarrLoading: boolean;
  shazarrResponse: ShazamioResponseType | undefined;
  recordingStatus: RecordingStatusType;
  audio: Blob | undefined;
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
  const [stream, setStream] = useState<MediaStream>();
  const [audioChunks, setAudioChunks] = useState([]);
  const [audio, setAudio] = useState<Blob>();
  const [shazarrResponse, setShazarrResponse] =
    useState<ShazamioResponseType>();
  const [shazarrLoading, setShazarrLoading] = useState(false);
  const [apiError, setApiError] = useState(false);
  const [recordingStatus, setRecordingStatus] =
    useState<RecordingStatusType>("inactive");
  const [config, setConfig] = useState<APIConfigType>();
  const [historySearch, setHistorySearch] = useState<string>();

  const {
    actions: { addItemToHistory, deleteHistoryItem },
  } = useHistoryProvider();

  const mediaRecorder = useRef<MediaRecorder | null>(null);

  const controller = new AbortController();
  const signal = controller.signal;

  const getMicrophonePermission = async () => {
    if ("MediaRecorder" in window) {
      try {
        const mediaDevices = navigator.mediaDevices as any;
        navigator.mediaDevices.getUserMedia =
          mediaDevices.getUserMedia ||
          mediaDevices.webkitGetUserMedia ||
          mediaDevices.mozGetUserMedia;

        const streamData = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        setStream(streamData);
        setRecordingStatus("granted");
      } catch (err: any) {
        resetSearch();
        alert(err.message);
      }
    } else {
      alert("The MediaRecorder API is not supported in your browser.");
    }
  };

  const startRecording = async () => {
    if (!stream) return;
    setRecordingStatus("recording");
    //create new Media recorder instance using the stream
    const media = new MediaRecorder(stream, { mimeType: SHAZARR_MIME_TYPE });
    //set the MediaRecorder instance to the mediaRecorder ref
    mediaRecorder.current = media;
    mediaRecorder.current.start();
    const localAudioChunks: [] = [];
    mediaRecorder.current.ondataavailable = (event) => {
      if (typeof event.data === "undefined") return;
      if (event.data.size === 0) return;
      localAudioChunks.push(event.data as never);
    };
    setAudioChunks(localAudioChunks);
  };

  const stopRecording = () => {
    if (!mediaRecorder.current) return;
    mediaRecorder.current.stop();
    mediaRecorder.current.onstop = () => {
      if (recordingStatus !== "recording") return;
      const audioBlob = new Blob(audioChunks, { type: SHAZARR_MIME_TYPE });
      stream?.getTracks().forEach((track) => track.stop());

      setAudio(audioBlob);
      setAudioChunks([]);

      setRecordingStatus("searching");
    };
  };

  const recognizeRecording = async () => {
    if (audio) {
      setShazarrLoading(true);
      blobToBase64(audio, async (base64) => {
        if (!base64 || base64.length === 0) return;
        const response = await recognize(base64, signal);
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
            if (historySearch) {
              deleteHistoryItem(historySearch);
              setHistorySearch(undefined);
            }
            addItemToHistory({
              title: formatted.track.title,
              artist: formatted.track.subtitle,
              date: Date.now(),
              data: formatted?.track,
            });
          }
        }
        setRecordingStatus("inactive");
        vibrateAction();
      });
    }
  };

  const resetSearch = () => {
    controller.abort();
    setShazarrResponse(undefined);
    setAudio(undefined);
    stream?.getTracks().forEach((track) => track.stop());
    setStream(undefined);
    setAudioChunks([]);
    setRecordingStatus("inactive");
    setShazarrLoading(false);
    setHistorySearch(undefined);
  };

  const blobToBase64 = (blob: Blob, cb: (base64: string) => void) => {
    const reader = new FileReader();
    reader.onload = function () {
      const dataUrl = reader.result;
      const base64 = (dataUrl as string)?.split(",")[1];
      cb(base64);
    };
    reader.readAsDataURL(blob);
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
        getMicrophonePermission();
        break;
      case "granted":
        vibrateAction();
        startRecording();
        break;
      case "recording":
        setTimeout(() => stopRecording(), RECORD_DURATION);
        break;
      case "searching":
        vibrateAction();
        if (audio) recognizeRecording();
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
