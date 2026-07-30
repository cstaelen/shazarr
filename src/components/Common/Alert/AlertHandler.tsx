import { Box } from "@mui/material";

import { useConfigProvider } from "../../Config/useConfig";
import { useHistoryProvider } from "../../History/useHistory";
import InlineResultCard from "../../Shazarr/ui/InlineResultCard";
import { useShazarrProvider } from "../../Shazarr/useShazarr";

import ApiErrorAlert from "./Alert";

export const AlertHandler = () => {
  const { recordingStatus, recordingError, showInlineResult, actions: { dismissInlineResult, setOpenResultDate } } = useShazarrProvider();
  const { isNetworkConnected } = useConfigProvider();
  const { history } = useHistoryProvider();

  const lastItem = history?.[history.length - 1];

  function handleDismiss() {
    dismissInlineResult();
    setOpenResultDate(undefined);
  }

  function handleOpenResult() {
    dismissInlineResult();
    if (lastItem) setOpenResultDate(lastItem.date);
  }

  return (
    <Box sx={{ maxWidth: 360, m: "10px auto 80px", width: "100%" }}>
      {showInlineResult && lastItem?.data && recordingStatus === "inactive" && (
        <InlineResultCard
          track={lastItem.data}
          onDismiss={handleDismiss}
          onOpen={handleOpenResult}
        />
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
