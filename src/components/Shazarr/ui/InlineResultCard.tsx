import { Close, RemoveRedEye } from "@mui/icons-material";
import { Box, ButtonBase, Card, CardActions, CardContent, CardMedia, IconButton, Typography } from "@mui/material";
import { ShazamTrack } from "shazam-api/dist/types";

import { ImageWithFallback } from "../../Common/ImageWithFallback";

interface Props {
  track: ShazamTrack;
  onDismiss: () => void;
  onOpen: () => void;
}

export default function InlineResultCard({ track, onDismiss, onOpen }: Props) {
  return (
    <Box sx={{ marginY: 2, width: "100%" }} data-testid="inline-result-card">
      <Card sx={{ display: "flex", alignItems: "center" }}>
        <CardMedia sx={{ lineHeight: 0, flex: "0 0 auto" }}>
          <ButtonBase onClick={onOpen}>
            <ImageWithFallback
              height="70"
              width="70"
              alt=""
              src={track?.images?.coverart || ""}
            />
          </ButtonBase>
        </CardMedia>
        <CardContent sx={{ padding: "0.5rem 1rem", flex: "1 1 0" }}>
          <ButtonBase sx={{ textAlign: "left", width: "100%", justifyContent: "flex-start" }} onClick={onOpen}>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.2 }}>
              <strong>{track.title}</strong>
              {track.subtitle && <><br />{track.subtitle}</>}
            </Typography>
          </ButtonBase>
        </CardContent>
        <CardActions>
          <IconButton onClick={onOpen} aria-label="View result">
            <RemoveRedEye />
          </IconButton>
          <IconButton onClick={onDismiss} aria-label="Dismiss result">
            <Close />
          </IconButton>
        </CardActions>
      </Card>
    </Box>
  );
}
