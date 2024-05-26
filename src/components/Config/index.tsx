import React from "react";
import { useShazarrProvider } from "../Shazarr/Provider";
import ApiErrorAlert from "./Alert";
import { useConfigProvider } from "./Provider";
import ConfigForm from "./Form";

export default function Config() {
  const { recordingStatus, recordingError } = useShazarrProvider();
  const { formConfig, isNetworkConnected } = useConfigProvider();

  if (!formConfig) return null;

  return (
    <>
      {!isNetworkConnected && recordingStatus === "inactive" && (
        <ApiErrorAlert severity="info" />
      )}
      {recordingError && recordingStatus === "inactive" && (
        <ApiErrorAlert message={recordingError} />
      )}

      <ConfigForm />
    </>
  );
}
