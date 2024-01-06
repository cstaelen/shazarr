import { ShazamioResponseType } from "@/app/types";
import { Check, MicOutlined } from "@mui/icons-material";
import { Chip, CircularProgress } from "@mui/material";
import { RecordingStatusType } from "./useShazarr";

export default function StatusChip({
  recordingStatus,
  loading,
  shazarrResponse,
}: {
  recordingStatus: RecordingStatusType;
  loading: boolean;
  shazarrResponse: ShazamioResponseType | undefined;
}) {
  return (
    <Chip
      color={
        shazarrResponse?.track
          ? "success"
          : loading || recordingStatus === "recording"
          ? "default"
          : shazarrResponse && !shazarrResponse?.track
          ? "warning"
          : "info"
      }
      icon={
        recordingStatus && recordingStatus !== "inactive" ? (
          <CircularProgress size={16} style={{ margin: "0 5px 0 10px" }} />
        ) : shazarrResponse?.track ? (
          <Check fontSize="small" />
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
          ? "Not found."
          : "Ready"
      }
      variant="outlined"
    />
  );
}
