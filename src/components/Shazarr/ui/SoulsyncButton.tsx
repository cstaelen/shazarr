import { useState } from "react";
import { OpenInNew } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import soulsyncLogo from "../../../resources/soulsync.png";
import { useConfigProvider } from "../../Config/useConfig";
import {
  soulsyncAddAlbumToWishlist,
  soulsyncAddTrackToWishlist,
  SoulsyncQueueResult,
} from "../api/soulsync";

function formatSoulsyncError(message: string): string {
  if (!message) return "Error — try manually";

  // Network errors
  if (/failed to fetch|network|networkerror/i.test(message)) return "SoulSync unreachable";
  if (/<!doctype|not valid json|unexpected token/i.test(message)) return "SoulSync unreachable";

  // Auth errors
  if (/401|unauthorized/i.test(message)) return "Invalid credentials";
  if (/403|forbidden/i.test(message)) return "Access denied";

  // Not found
  if (/404/i.test(message)) return "SoulSync not found — check URL";

  // Server errors
  if (/5\d\d|service unavailable|bad gateway/i.test(message)) return "SoulSync unreachable";

  // Default: return the original message
  return message;
}

type SoulsyncStatus = "idle" | "searching" | "loading" | "success" | "error";

// SoulSync logo component
function SoulsyncLogoIcon() {
  return <img src={soulsyncLogo} alt="SoulSync" style={{ width: 32, height: 32 }} />;
}

export default function SoulsyncButton({
  albumTitle,
  trackTitle,
  artistName,
  url,
}: {
  albumTitle: string;
  trackTitle: string;
  artistName: string;
  url: string;
}) {
  const { isNetworkConnected, config } = useConfigProvider();
  const [status, setStatus] = useState<SoulsyncStatus>("idle");
  const [message, setMessage] = useState<string>();
  const [dialogOpen, setDialogOpen] = useState(false);

  const apiKey = config?.soulsync_api_key;
  const profileId = config?.soulsync_profile_id 
    ? parseInt(config.soulsync_profile_id, 10) 
    : undefined;

  async function handleAdd(type: "track" | "album") {
    setDialogOpen(false);
    setStatus("searching");
    setMessage("");

    const effectiveAlbumTitle = albumTitle || trackTitle;

    let result: SoulsyncQueueResult;
    if (type === "track") {
      result = await soulsyncAddTrackToWishlist(
        url,
        trackTitle,
        artistName,
        apiKey,
        profileId
      );
    } else {
      result = await soulsyncAddAlbumToWishlist(
        url,
        effectiveAlbumTitle,
        artistName,
        apiKey,
        profileId
      );
    }

    handleResult(result);
  }

  function handleResult(result: SoulsyncQueueResult) {
    setMessage(result.success ? result.message : formatSoulsyncError(result.message));
    setStatus(result.success ? "success" : "error");
  }

  function handleClick() {
    if (!apiKey) {
      window.open(url, "_blank");
      return;
    }
    setDialogOpen(true);
  }

  const label = {
    idle: "SoulSync",
    searching: "Searching...",
    loading: "Adding...",
    success: message || "Added!",
    error: message || "Error — try manually",
  }[status];

  const searchUrl = `${url}`;

  return (
    <>
      <Stack direction="row" spacing={1}>
        <Button
          variant="contained"
          fullWidth
          disabled={!isNetworkConnected || status === "loading"}
          startIcon={
            status === "loading" ? (
              <CircularProgress size={20} color="inherit" />
            ) : (
              <SoulsyncLogoIcon />
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
          data-testid="soulsync-button"
        >
          <strong>{label}</strong>
        </Button>
        
        {apiKey && (
          <Tooltip title="Open SoulSync">
            <span>
              <IconButton
                color="primary"
                onClick={() => window.open(searchUrl, "_blank")}
                disabled={!isNetworkConnected}
                sx={{ border: 2, borderRadius: 1 }}
              >
                <OpenInNew fontSize="medium" />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Stack>
      
      {/* Dialog to choose between Track and Album */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        fullWidth
        maxWidth="xs"
        data-testid="soulsync-dialog"
      >
        <DialogTitle>Add to SoulSync</DialogTitle>
        <DialogContent sx={{ padding: 1 }}>
          <Stack spacing={1}>
            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                overflow: "hidden",
              }}
            >
              <Button
                fullWidth
                variant="text"
                onClick={() => handleAdd("track")}
                sx={{ justifyContent: "flex-start", padding: 2 }}
                startIcon={<SoulsyncLogoIcon />}
                data-testid="soulsync-add-track"
              >
                <Typography variant="body1">
                  <strong>Add Track</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                  {trackTitle}
                </Typography>
              </Button>
            </Box>

            <Box
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 1,
                overflow: "hidden",
              }}
            >
              <Button
                fullWidth
                variant="text"
                onClick={() => handleAdd("album")}
                sx={{ justifyContent: "flex-start", padding: 2 }}
                startIcon={<SoulsyncLogoIcon />}
                data-testid="soulsync-add-album"
              >
                <Typography variant="body1">
                  <strong>Add Album</strong>
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
                  {albumTitle || trackTitle}
                </Typography>
              </Button>
            </Box>
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}
