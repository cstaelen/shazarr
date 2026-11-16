import { useState } from "react";
import { Album, Download, Favorite, OpenInNew } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  styled,
  Tooltip,
  Typography,
} from "@mui/material";

import { useConfigProvider } from "../../Config/useConfig";
import { ServiceErrorKind, serviceErrorLabels, toServiceError } from "../api/errors";
import {
  TidalAlbum,
  tidalCoverUrl,
  tidarrFavoriteTrack,
  tidarrQueueAlbum,
  TidarrQueueResult,
  tidarrQueueTrack,
  tidarrSearchAlbums,
} from "../api/tidarr";

const LABELS = serviceErrorLabels("Tidarr");

/**
 * `kind` is set by the client, which still had the status code. The text rules
 * only cover errors raised outside it, such as a track missing from an album it
 * did find.
 */
function formatTidarrError(message: string, kind?: ServiceErrorKind): string {
  if (kind && LABELS[kind]) return LABELS[kind];
  if (/track not found/i.test(message)) return "Track not found on Tidal";
  if (/credentials/i.test(message)) return "Tidal not logged in — check Tidarr";
  return message || "Error — try manually";
}

type TidarrStatus = "idle" | "loading" | "success" | "error";

export default function TidarrButton({
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
  const [status, setStatus] = useState<TidarrStatus>("idle");
  const [successMessage, setSuccessMessage] = useState("Added to Tidarr!");
  const [errorMessage, setErrorMessage] = useState("Error — try manually");
  const [albums, setAlbums] = useState<TidalAlbum[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const apiKey = config?.tidarr_api_key;

  function setError(msg: string, kind?: ServiceErrorKind) {
    setErrorMessage(formatTidarrError(msg, kind));
    setStatus("error");
  }

  function setErrorFromException(e: unknown) {
    const error = toServiceError(e);
    setError(error.message, error.kind);
  }

  async function handleClick() {
    if (!apiKey) {
      window.open(`${url}/search/${encodeURIComponent(`${trackTitle} ${artistName}`)}`, "_blank");
      return;
    }

    setStatus("loading");
    try {
      const results = await tidarrSearchAlbums(url, apiKey, artistName, albumTitle, trackTitle);
      if (results.length === 0) {
        setError("Track not found on Tidal");
        return;
      }
      setAlbums(results);
      setDialogOpen(true);
      setStatus("idle");
    } catch (e) {
      setErrorFromException(e);
    }
  }

  async function handleQueue(album: TidalAlbum, type: "album" | "track" | "favorite") {
    setDialogOpen(false);
    setStatus("loading");

    try {
      let result: TidarrQueueResult;
      if (type === "album") {
        result = await tidarrQueueAlbum(url, apiKey!, album, artistName);
      } else if (type === "track") {
        result = await tidarrQueueTrack(url, apiKey!, album.id, trackTitle);
      } else {
        result = await tidarrFavoriteTrack(url, apiKey!, album.id, trackTitle);
      }

      if (result.success) {
        if (result.message) setSuccessMessage(result.message);
        setStatus("success");
      } else {
        setError(result.message, result.kind);
      }
    } catch (e) {
      setErrorFromException(e);
    }
  }

  const label = {
    idle: "Download with Tidarr",
    loading: "Searching...",
    success: successMessage,
    error: errorMessage,
  }[status];

  return (
    <>
      <Stack direction="row" spacing={1}>
        <Button
          variant="contained"
          fullWidth
          disabled={!isNetworkConnected || status === "loading"}
          startIcon={
            status === "loading" ? <CircularProgress size={20} color="inherit" /> : <AlbumStyled />
          }
          color={status === "success" ? "success" : status === "error" ? "warning" : "primary"}
          onClick={handleClick}
        >
          <strong>{label}</strong>
        </Button>
        {apiKey && (
          <Tooltip title="Open Tidarr search">
            <span>
              <IconButton
                color="primary"
                onClick={() =>
                  window.open(
                    `${url}/search/${encodeURIComponent(`${trackTitle} ${artistName}`)}`,
                    "_blank",
                  )
                }
                disabled={!isNetworkConnected}
                sx={{ border: 2, borderRadius: 1 }}
              >
                <OpenInNew />
              </IconButton>
            </span>
          </Tooltip>
        )}
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Choose an album</DialogTitle>
        <DialogContent sx={{ padding: 1 }}>
          <Stack spacing={1}>
            {albums.map((album) => (
              <Box
                key={album.id}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  overflow: "hidden",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, padding: 1 }}>
                  <img
                    src={tidalCoverUrl(album.cover)}
                    alt={album.title}
                    width={48}
                    height={48}
                    style={{ borderRadius: 4, flexShrink: 0 }}
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: "bold" }} noWrap>
                      {album.title}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                      sx={{ display: "block" }}
                    >
                      {album.artists?.[0]?.name}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      noWrap
                      sx={{ display: "block" }}
                    >
                      {album.releaseDate?.slice(0, 4)} · {album.numberOfTracks} tracks
                    </Typography>
                  </Box>
                </Box>
                <Stack direction="row" sx={{ borderTop: "1px solid", borderColor: "divider" }}>
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<Download fontSize="small" />}
                    onClick={() => handleQueue(album, "album")}
                    sx={{ flex: 1, borderRadius: 0 }}
                  >
                    Album
                  </Button>
                  <Button
                    size="small"
                    variant="text"
                    startIcon={<Download fontSize="small" />}
                    onClick={() => handleQueue(album, "track")}
                    sx={{
                      flex: 1,
                      borderRadius: 0,
                      borderLeft: "1px solid",
                      borderColor: "divider",
                    }}
                  >
                    Track
                  </Button>
                  <Button
                    size="small"
                    variant="text"
                    color="secondary"
                    onClick={() => handleQueue(album, "favorite")}
                    sx={{
                      borderRadius: 0,
                      borderLeft: "1px solid",
                      borderColor: "divider",
                      px: 1.5,
                    }}
                  >
                    <Favorite fontSize="small" />
                  </Button>
                </Stack>
              </Box>
            ))}
          </Stack>
        </DialogContent>
      </Dialog>
    </>
  );
}

const AlbumStyled = styled(Album)`
  font-size: 32px !important;
`;
