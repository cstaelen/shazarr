import { Box } from "@mui/material";

import { useConfigProvider } from "../../Config/useConfig";
import { useShazarrProvider } from "../../Shazarr/useShazarr";

import ApiErrorAlert from "./Alert";

export const AlertHandler = () => {
  const { recordingStatus, recordingError } = useShazarrProvider();
  const { isNetworkConnected } = useConfigProvider();

  return (
    <Box sx={{ mb: 10, maxWidth: 360, m: "0 auto" }}>
        {!isNetworkConnected && recordingStatus === "inactive" && (
            <ApiErrorAlert severity="info" />
        )}
        {recordingError && recordingStatus === "inactive" && (
            <ApiErrorAlert message={recordingError} />
        )}
    </Box>
  );
};