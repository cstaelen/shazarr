import { Close } from "@mui/icons-material";
import { Box, Card, CardContent, CardMedia, IconButton, Typography } from "@mui/material";
import { ShazamTrack } from "shazam-api/dist/types";

import { ImageWithFallback } from "../../Common/ImageWithFallback";

interface Props {
  track: ShazamTrack;
  onDismiss: () => void;
}

export default function InlineResultCard({ track, onDismiss }: Props) {
  return (
    <Box sx={{ marginY: 2 }} data-testid="inline-result-card">
      <Card sx={{ display: "flex", alignItems: "center" }}>
        <CardMedia sx={{ lineHeight: 0, padding: 1 }}>
          <ImageWithFallback
            height="50"
            width="50"
            alt=""
            src={track?.images?.coverart || ""}
          />
        </CardMedia>
        <CardContent sx={{ padding: "0.5rem", flex: "1 1 0" }}>
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.2 }}>
            <strong>{track.title}</strong>
            {track.subtitle && ` - ${track.subtitle}`}
          </Typography>
        </CardContent>
        <IconButton onClick={onDismiss} aria-label="Dismiss result">
          <Close />
        </IconButton>
      </Card>
    </Box>
  );
}
