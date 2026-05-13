import { Box } from "@mui/material";

import { useConfigProvider } from "../../Config/useConfig";
import { useHistoryProvider } from "../../History/useHistory";
import InlineResultCard from "../../Shazarr/ui/InlineResultCard";
import { useShazarrProvider } from "../../Shazarr/useShazarr";

import ApiErrorAlert from "./Alert";

export const AlertHandler = () => {
  const { recordingStatus, recordingError, showInlineResult, actions: { dismissInlineResult } } = useShazarrProvider();
  const { isNetworkConnected } = useConfigProvider();
  const { history } = useHistoryProvider();

  const lastItem = history?.[history.length - 1];

  return (
    <Box sx={{ mb: 10, maxWidth: 360, m: "10 auto" }}>
      {showInlineResult && lastItem?.data && recordingStatus === "inactive" && (
        <InlineResultCard track={lastItem.data} onDismiss={dismissInlineResult} />
      )}
      {!isNetworkConnected && recordingStatus === "inactive" && (
        <ApiErrorAlert severity="info" />
      )}
      {recordingError && recordingStatus === "inactive" && (
        <ApiErrorAlert message={recordingError} />
      )}
    </Box>
  );
};
