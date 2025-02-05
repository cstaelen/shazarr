import { useShazarrProvider } from "../Shazarr/Provider";

import ApiErrorAlert from "./Alert";
import ConfigForm from "./Form";
import { useConfigProvider } from "./Provider";

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
