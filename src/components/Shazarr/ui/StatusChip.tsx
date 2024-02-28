import { Check, MicOutlined, NetworkPing } from "@mui/icons-material";
import { Chip, CircularProgress } from "@mui/material";
import { useShazarrProvider } from "../Provider";
import { useConfigProvider } from "../../Config/Provider";

export default function StatusChip() {
  const { shazarrLoading, shazarrResponse, recordingStatus } =
    useShazarrProvider();
  const { isNetworkConnected } = useConfigProvider();

  return (
    <Chip
      color={
        shazarrResponse
          ? "success"
          : shazarrLoading || recordingStatus === "recording"
            ? "default"
            : shazarrResponse && !shazarrResponse
              ? "warning"
              : !isNetworkConnected
                ? "error"
                : "info"
      }
      icon={
        recordingStatus && recordingStatus !== "inactive" ? (
          <CircularProgress size={16} style={{ margin: "0 5px 0 10px" }} />
        ) : shazarrResponse ? (
          <Check fontSize="small" />
        ) : !isNetworkConnected ? (
          <NetworkPing fontSize="small" />
        ) : (
          <MicOutlined fontSize="small" />
        )
      }
      label={
        recordingStatus && recordingStatus !== "inactive"
          ? `${recordingStatus}...`
          : shazarrResponse
            ? "Found !"
            : shazarrResponse && !shazarrResponse
              ? "Not found. Get closer."
              : !isNetworkConnected
                ? "Offline mode"
                : "Ready"
      }
      variant="outlined"
    />
  );
}
