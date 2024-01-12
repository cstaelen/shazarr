import { getConfig, recognize } from "../../server/queryApi";
import {
  APIConfigType,
  ApiReturnType,
  ShazamioResponseType,
} from "../../types";
import { useState, useRef, useEffect } from "react";

export type RecordingStatusType =
  | "start"
  | "granted"
  | "recording"
  | "searching"
  | "inactive";

const SHAZARR_MIME_TYPE = "audio/webm";

export default function useShazarr() {
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

  const mediaRecorder = useRef<MediaRecorder | null>(null);

  const controller = new AbortController();
  const signal = controller.signal;

  const getMicrophonePermission = async () => {
    if ("MediaRecorder" in window) {
      try {
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
        console.log(response);
        if ((response as ApiReturnType).error) {
          console.log("error", response);
          setApiError(true);
          resetSearch();
        } else {
          const formatted = JSON.parse(response) as ShazamioResponseType;
          setShazarrResponse(formatted);
          setShazarrLoading(false);
        }
        setRecordingStatus("inactive");
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
        startRecording();
        break;
      case "recording":
        setTimeout(() => stopRecording(), 5000);
        break;
      case "searching":
        if (audio) recognizeRecording();
        break;
    }
  }, [recordingStatus]);

  useEffect(() => {
    if (config) return;
    fetchConfig();
  }, []);

  return {
    config,
    apiError,
    shazarrLoading,
    shazarrResponse,
    recordingStatus,
    audio,
    actions: {
      setRecordingStatus,
      resetSearch,
    },
  };
}
