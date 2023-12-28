import { useEffect, useState } from "react";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
import Typography from "@mui/material/Typography";
import { ShazamioTrackType } from "../../types";
import {
  PauseCircleFilled,
  PlayCircleFilled,
} from "@mui/icons-material";
import { Button } from "@mui/material";

export default function CardResult({ data }: { data: ShazamioTrackType }) {
  const theme = useTheme();
  const [sample, setSample] = useState<HTMLAudioElement>();
  const [isPlaying, setIsPlaying] = useState<boolean>();

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
    const sampleURI = data?.hub.actions.filter((action) => !!action.uri)[0].uri;
    if (sampleURI) {
      const player = new Audio(sampleURI);
      setSample(player);
    }
  }, [data]);

  return (
    <Card sx={{ display: "flex" }}>
      <Box sx={{ display: "flex", flexDirection: "column", flexGrow: "1", textAlign: "left" }}>
        <CardContent sx={{ flex: "1 0 auto" }}>
          <Typography component="div" variant="h6" lineHeight={1.2}>
            {data.title}
          </Typography>
          <Typography
            variant="subtitle1"
            color="text.secondary"
            component="div"
          >
            {data.subtitle}
          </Typography>
        </CardContent>
        {sample && (
          <Box sx={{ display: "flex", alignItems: "center", pl: 1, pb: 1 }}>
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
          </Box>
        )}
      </Box>
      <CardMedia
        component="img"
        sx={{ width: 151 }}
        image={data.images.coverart}
        alt=""
      />
    </Card>
  );
}
