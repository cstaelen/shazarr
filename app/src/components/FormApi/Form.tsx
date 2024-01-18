import { Preferences } from "@capacitor/preferences";
import {
  Box,
  Input,
  Button,
  Paper,
  Dialog,
  DialogContent,
} from "@mui/material";
import { useState, useRef, useEffect } from "react";
import { useShazarrProvider } from "../Shazarr/Provider";
import ApiErrorAlert from "./Alert";
import styled from "@emotion/styled";

export default function FormApi() {
  const [apiUrl, setApiUrl] = useState<string>();
  const [showApiForm, setShowApiForm] = useState<boolean>();
  const inputRef = useRef<HTMLInputElement>();
  const {
    recordingStatus,
    recordingError,
    apiError,
    actions: { fetchConfig },
  } = useShazarrProvider();

  async function saveApiUrl() {
    if (inputRef.current) {
      const url = inputRef.current.querySelector("input")?.value;
      if (url) {
        setApiUrl(url);
        await Preferences.set({ key: "shazarr_api_url", value: url });
      }
      setShowApiForm(false);
      fetchConfig();
    }
  }

  async function handleApiURL() {
    const { value: existingUrl } = await Preferences.get({
      key: "shazarr_api_url",
    });

    if (existingUrl) {
      setApiUrl(existingUrl);
      const input = inputRef?.current?.querySelector("input");
      if (input) {
        input.value = existingUrl;
      }
    }
  }

  useEffect(() => {
    handleApiURL();
  }, []);

  return (
    <>
      {apiError && recordingStatus === "inactive" && <ApiErrorAlert />}
      {recordingError && recordingStatus === "inactive" && (
        <ApiErrorAlert message={recordingError} />
      )}
      <Dialog
        fullWidth
        maxWidth="xs"
        open={!!showApiForm}
        onClose={() => setShowApiForm(false)}
      >
        <DialogContent sx={{ padding: "0.5rem" }}>
          <Box>
            <Box marginBottom={2}>
              <Paper sx={{ padding: "0.5rem" }}>
                <Input
                  type="url"
                  sx={{ fontSize: "0.925rem" }}
                  defaultValue={apiUrl}
                  placeholder="Shazarr API URL (http://...:12358)"
                  fullWidth
                  ref={inputRef}
                />
              </Paper>
            </Box>
            <Box>
              <Button
                fullWidth
                type="submit"
                variant="contained"
                onClick={() => saveApiUrl()}
              >
                Save API URL
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
      <ButtonConfig>
        <Button
          onClick={() => setShowApiForm(!showApiForm)}
          disabled={recordingStatus !== "inactive"}
        >
          Server configuration
        </Button>
      </ButtonConfig>
    </>
  );
}

const ButtonConfig = styled.div`
  margin-bottom: 1rem;
`;
