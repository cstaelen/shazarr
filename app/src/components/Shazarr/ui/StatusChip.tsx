
import { Check, MicOutlined, NetworkPing } from "@mui/icons-material";
import { Chip, CircularProgress } from "@mui/material";
import { useShazarrProvider } from "../Provider";

export default function StatusChip() {
  const { shazarrLoading, shazarrResponse, apiError, recordingStatus } =
    useShazarrProvider();

  return (
    <Chip
      color={
        shazarrResponse?.track
          ? "success"
          : shazarrLoading || recordingStatus === "recording"
          ? "default"
          : shazarrResponse && !shazarrResponse?.track
          ? "warning"
          : apiError
          ? "error"
          : "info"
      }
      icon={
        recordingStatus && recordingStatus !== "inactive" ? (
          <CircularProgress size={16} style={{ margin: "0 5px 0 10px" }} />
        ) : shazarrResponse?.track ? (
          <Check fontSize="small" />
        ) : apiError ? (
          <NetworkPing fontSize="small" />
        ) : (
          <MicOutlined fontSize="small" />
        )
      }
      label={
        recordingStatus && recordingStatus !== "inactive"
          ? `${recordingStatus}...`
          : shazarrResponse?.track
          ? "Found !"
          : shazarrResponse && !shazarrResponse?.track
          ? "Not found. Get closer."
          : apiError
          ? "Offline mode"
          : "Ready"
      }
      variant="outlined"
    />
  );
}
