import { Box, Alert } from "@mui/material";

export default function ApiErrorAlert() {
  return (
    <Box marginY={2} textAlign="left">
      <Alert severity="error">
        An error occured while connection to Shazarr API. Please, check your API
        configuration.
      </Alert>
    </Box>
  );
}
