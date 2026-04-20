import { useState } from "react";
import { Button, CircularProgress } from "@mui/material";

import lidarrLogo from "../../../resources/lidarr.png";
import { useConfigProvider } from "../../Config/useConfig";
import { lidarrAutoSearch } from "../api/lidarr";

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
    setStatus(result.success ? "success" : "error");

    setTimeout(() => setStatus("idle"), 3000);
  }

  const label = {
    idle: "Download with Lidarr",
    loading: "Searching...",
    success: "Added to Lidarr!",
    error: "Not found — try manually",
  }[status];

  return (
    <Button
      variant="contained"
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
  );
}
