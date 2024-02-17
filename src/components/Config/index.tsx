import { useShazarrProvider } from "../Shazarr/Provider";
import ApiErrorAlert from "./Alert";
import { useConfigProvider } from "./Provider";
import ModalConfig from "./modals/ModalConfig";
import ModalLogs from "./modals/ModalLogs";

export default function Config() {
  const { recordingStatus, recordingError } = useShazarrProvider();
  const { formConfig, isNetworkConnected, isDebugMode } = useConfigProvider();

  if (!formConfig) return null;

  return (
    <>
      {!isNetworkConnected && recordingStatus === "inactive" && (
        <ApiErrorAlert severity="info" />
      )}
      {recordingError && recordingStatus === "inactive" && (
        <ApiErrorAlert message={recordingError} />
      )}

      {isDebugMode ? <ModalLogs /> : null}
      <ModalConfig />
    </>
  );
}
