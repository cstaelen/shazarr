import React from "react";
import { Box, Alert } from "@mui/material";
import errorCode, { ErrorCodeType } from "./errorCode";

export default function ApiErrorAlert({
  message,
  severity = "error",
}: {
  message?: ErrorCodeType;
  severity?: "info" | "error" | "warning" | "success";
}) {
  return (
    <Box marginY={2} textAlign="left">
      <Alert severity={severity}>
        {message
          ? errorCode[message]
          : "Internet is not reachable. In offline mode record the song and identify it later :)"}
      </Alert>
    </Box>
  );
}
