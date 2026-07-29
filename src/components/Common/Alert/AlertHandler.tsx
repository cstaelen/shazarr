import { Box } from "@mui/material";

import { useConfigProvider } from "../../Config/useConfig";
import { useHistoryProvider } from "../../History/useHistory";
import ShazarrResults from "../../Shazarr/Result";
import InlineResultCard from "../../Shazarr/ui/InlineResultCard";
import { useShazarrProvider } from "../../Shazarr/useShazarr";

import ApiErrorAlert from "./Alert";

export const AlertHandler = () => {
  const { recordingStatus, recordingError, showInlineResult, openResultDate, actions: { dismissInlineResult, setOpenResultDate } } = useShazarrProvider();
  const { isNetworkConnected } = useConfigProvider();
  const { history } = useHistoryProvider();

  const lastItem = history?.[history.length - 1];
  const isOpen = !!lastItem && openResultDate === lastItem.date;

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
      <ShazarrResults
        data={isOpen ? lastItem.data : undefined}
        onClose={() => setOpenResultDate(undefined)}
      />
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
