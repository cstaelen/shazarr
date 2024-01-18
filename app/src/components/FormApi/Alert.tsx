import { Box, Alert } from "@mui/material";
import errorCode, { ErrorCodeType } from "./errorCode";

export default function ApiErrorAlert({
  message,
}: {
  message?: ErrorCodeType;
}) {
  return (
    <Box marginY={2} textAlign="left">
      <Alert severity="error">
        {message
          ? errorCode[message]
          : "An error occured while connection to Shazarr API. Please, check your API configuration."}
      </Alert>
    </Box>
  );
}
