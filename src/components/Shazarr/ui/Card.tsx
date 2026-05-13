import { useEffect, useMemo, useState } from "react";
import { App } from "@capacitor/app";
import {
  PauseCircleFilled,
  PlayCircleFilled,
  Refresh,
} from "@mui/icons-material";
import {
  Button,
  CardActions,
  CardMedia,
} from "@mui/material";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { ShazamTrack } from "shazam-api/dist/types";

import { ImageWithFallback } from "../../Common/ImageWithFallback";

export default function CardResult({ data, onClose }: { data: ShazamTrack; onClose: () => void }) {
  const [isPlaying, setIsPlaying] = useState<boolean>();

  const sampleURI = useMemo(
    () => data?.hub?.actions?.filter((action) => !!action.uri)?.[0]?.uri,
    [data],
  );

  const sample = useMemo(
    () => (sampleURI ? new Audio(sampleURI) : undefined),
    [sampleURI],
  );

  function togglePlayPause() {
    if (!sample) return;

    if (!isPlaying) {
      sample.play();
      setIsPlaying(true);
    } else {
      sample.pause();
      setIsPlaying(false);
    }
  }

  useEffect(() => {
    if (!sample) return;

    function pausePlayer() {
      sample?.pause();
      sample?.remove();
      setIsPlaying(false);
    }

    App.addListener("pause", () => pausePlayer());
    App.addListener("backButton", () => pausePlayer());

    return () => {
      pausePlayer();
    };
  }, [sample]);

  return (
    <Card sx={{ maxWidth: 280, margin: "0 auto 1rem" }}>
      <CardMedia>
        <ImageWithFallback width="400" alt="" src={data.images.coverart} />
      </CardMedia>
      <CardContent>
        <Typography gutterBottom variant="h5" component="div">
          {data.title}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {data.subtitle}
        </Typography>
      </CardContent>
      {sample && (
        <CardActions>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              width: "100%",
              px: 2,
              pb: 2,
            }}
          >
            <Button
              variant="outlined"
              startIcon={
                isPlaying ? (
                  <PauseCircleFilled sx={{ height: 24, width: 24 }} />
                ) : (
                  <PlayCircleFilled sx={{ height: 24, width: 24 }} />
                )
              }
              aria-label={isPlaying ? "pause" : "play"}
              onClick={togglePlayPause}
            >
              {isPlaying ? "Pause" : "Play"}
            </Button>
            &nbsp;
            <Button
              onClick={onClose}
              variant="outlined"
              color="warning"
            >
              <Refresh style={{ transform: "rotate(-180deg)" }} />
            </Button>
          </Box>
        </CardActions>
      )}
    </Card>
  );
}
