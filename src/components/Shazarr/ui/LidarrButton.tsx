import { useState } from "react";
import { OpenInNew } from "@mui/icons-material";
import { Button, CircularProgress, IconButton, Stack, Tooltip } from "@mui/material";

import lidarrLogo from "../../../resources/lidarr.png";
import { useConfigProvider } from "../../Config/useConfig";
import { lidarrAutoSearch } from "../api/lidarr";

function formatLidarrError(message: string): string {
  if (/failed to fetch|network|networkerror/i.test(message)) return "Lidarr unreachable";
  if (/<!doctype|not valid json|unexpected token/i.test(message)) return "Lidarr unreachable";
  if (/401|unauthorized/i.test(message)) return "Invalid API key";
  if (/403|forbidden/i.test(message)) return "Access denied";
  if (/404/i.test(message)) return "Lidarr not found — check URL";
  if (/5\d\d|service unavailable|bad gateway/i.test(message)) return "Lidarr unreachable";
  if (/album not found/i.test(message)) return "Album not found in Lidarr";
  if (/artist not found/i.test(message)) return "Artist not found";
  if (/missing/i.test(message)) return "Missing album or artist name";
  return message || "Error — try manually";
}

type LidarrStatus = "idle" | "loading" | "success" | "error";

export default function LidarrButton({
  albumTitle,
  artistName,
  url,
}: {
  albumTitle: string;
  artistName: string;
  url: string;
}) {
  const { isNetworkConnected, config } = useConfigProvider();
  const [status, setStatus] = useState<LidarrStatus>("idle");
  const [successMessage, setSuccessMessage] = useState("Search triggered in Lidarr!");
  const [errorMessage, setErrorMessage] = useState("Error — try manually");

  const apiKey = config?.lidarr_api_key;

  async function handleClick() {
    if (!apiKey) {
      window.open(
        `${url}/add/search?term=${encodeURIComponent(`${albumTitle} ${artistName}`)}`,
        "_blank"
      );
      return;
    }

    setStatus("loading");
    const result = await lidarrAutoSearch(url, apiKey, albumTitle, artistName);
    if (result.success) {
      const s = result.status ?? "queued";
      setSuccessMessage(
        s === "available" ? "Already in Lidarr library" : "Search triggered in Lidarr!"
      );
      setStatus("success");
    } else {
      setErrorMessage(formatLidarrError(result.message));
      setStatus("error");
    }

    setTimeout(() => setStatus("idle"), 3000);
  }

  const label = {
    idle: "Download with Lidarr",
    loading: "Searching...",
    success: successMessage,
    error: errorMessage,
  }[status];

  const searchUrl = `${url}/add/search?term=${encodeURIComponent(`${albumTitle} ${artistName}`)}`;

  return (
    <Stack direction="row" spacing={1}>
      <Button
        variant="contained"
        fullWidth
        disabled={!isNetworkConnected || status === "loading"}
        startIcon={
          status === "loading" ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <img src={lidarrLogo} alt="" width="32" height="32" />
          )
        }
        color={
          status === "success"
            ? "success"
            : status === "error"
              ? "warning"
              : "primary"
        }
        onClick={handleClick}
      >
        <strong>{label}</strong>
      </Button>
      {apiKey && (
        <Tooltip title="Open Lidarr search">
          <span>
            <IconButton
              color="primary"
              onClick={() => window.open(searchUrl, "_blank")}
              disabled={!isNetworkConnected}
              sx={{ border: 2, borderRadius: 1 }}
            >
              <OpenInNew />
            </IconButton>
          </span>
        </Tooltip>
      )}
    </Stack>
  );
}
