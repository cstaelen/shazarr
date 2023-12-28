"use client";

import { SHAZARR_MIME_TYPE } from "@/app/constants";
import { recognize } from "@/app/server/queryApi";
import { ApiReturnType, ShazamioResponseType } from "@/app/types";
import { useState, useRef, useEffect } from "react";

export default function useShazarr() {
  const [permission, setPermission] = useState(false);
  const [stream, setStream] = useState<MediaStream>();
  const [audioChunks, setAudioChunks] = useState([]);
  const [audio, setAudio] = useState<Blob>();
  const [shazarrResponse, setShazarrResponse] = useState<ShazamioResponseType>();
  const [shazarrLoading, setShazarrLoading] = useState(false);
  const [recordingStatus, setRecordingStatus] = useState<
    "start" | "granted" | "recording" | "searching" | "inactive"
  >("inactive");

  const mediaRecorder = useRef<MediaRecorder | null>(null);

  const getMicrophonePermission = async () => {
    if ("MediaRecorder" in window) {
      try {
        const streamData = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: false,
        });
        setPermission(true);
        setStream(streamData);
        setRecordingStatus("granted");
      } catch (err: any) {
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
    let localAudioChunks: [] = [];
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
      const audioBlob = new Blob(audioChunks, { type: SHAZARR_MIME_TYPE });
      const audioUrl = URL.createObjectURL(audioBlob);
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
        const response = await recognize(base64);
        if ((response as ApiReturnType).error) {
          console.log('error', response);
        } else {
          const formatted = JSON.parse(
            response.replaceAll("False", "false").replaceAll("'", '"')
          ) as ShazamioResponseType;
          setShazarrResponse(formatted);
          setAudio(undefined);
          setStream(undefined);
          setAudioChunks([]);
        }
        setShazarrLoading(false);
        setRecordingStatus("inactive");
      });
    }
  };

  const resetSearch = () => {
    setShazarrResponse(undefined);
    setRecordingStatus("inactive");
  };

  const blobToBase64 = (blob: Blob, cb: (base64: string) => void) => {
    var reader = new FileReader();
    reader.onload = function() {
      var dataUrl = reader.result;
      var base64 = (dataUrl as string)?.split(',')[1];
      cb(base64);
    };
    reader.readAsDataURL(blob);
  };

  useEffect(() => {
    if (shazarrResponse) return;

    switch (recordingStatus) {
      case "start":
          getMicrophonePermission() 
        break;
        case "granted":
          startRecording();
          break;
        case "recording":
        setTimeout(() => stopRecording(), 5000);
        break;
      case "searching":
        if (audio) recognizeRecording();
    }
  }, [recordingStatus]);

  return {
    shazarrLoading,
    shazarrResponse,
    recordingStatus,
    audio,
    actions: {
      setRecordingStatus,
      resetSearch,
    }
  }
}