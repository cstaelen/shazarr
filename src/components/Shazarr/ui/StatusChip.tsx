
import { Check, MicOutlined, NetworkPing } from "@mui/icons-material";
import { Chip, CircularProgress } from "@mui/material";

import { useConfigProvider } from "../../Config/useConfig";
import { useShazarrProvider } from "../useShazarr";

export default function StatusChip() {
  const { shazarrLoading, showInlineResult, recordingStatus } =
    useShazarrProvider();
  const { isNetworkConnected } = useConfigProvider();

  return (
    <Chip
      color={
        showInlineResult
          ? "success"
          : shazarrLoading || recordingStatus === "recording"
            ? "default"
            : !isNetworkConnected
              ? "error"
              : "info"
      }
      icon={
        recordingStatus && recordingStatus !== "inactive" ? (
          <CircularProgress size={16} style={{ margin: "0 5px 0 10px" }} />
        ) : showInlineResult ? (
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
          : showInlineResult
            ? "Found !"
            : !isNetworkConnected
              ? "Offline mode"
              : "Ready"
      }
      variant="outlined"
    />
  );
}
