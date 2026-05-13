import { useState } from "react";
import { Close, RemoveRedEye } from "@mui/icons-material";
import { Box, ButtonBase, Card, CardContent, CardMedia, IconButton, Typography } from "@mui/material";
import { ShazamTrack } from "shazam-api/dist/types";

import { ImageWithFallback } from "../../Common/ImageWithFallback";
import ShazarrResults from "../Result";

interface Props {
  track: ShazamTrack;
  onDismiss: () => void;
}

export default function InlineResultCard({ track, onDismiss }: Props) {
  const [resultOpen, setResultOpen] = useState(false);

  return (
    <>
      <ShazarrResults
        data={resultOpen ? track : undefined}
        onClose={() => setResultOpen(false)}
      />
      <Box sx={{ marginY: 2 }} data-testid="inline-result-card">
        <Card sx={{ display: "flex", alignItems: "center" }}>
          <CardMedia sx={{ lineHeight: 0, padding: 1 }}>
            <ButtonBase onClick={() => setResultOpen(true)}>
              <ImageWithFallback
                height="50"
                width="50"
                alt=""
                src={track?.images?.coverart || ""}
              />
            </ButtonBase>
          </CardMedia>
          <CardContent sx={{ padding: "0.5rem", flex: "1 1 0" }}>
            <ButtonBase sx={{ textAlign: "left" }} onClick={() => setResultOpen(true)}>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.2 }}>
                <strong>{track.title}</strong>
                {track.subtitle && <><br />{track.subtitle}</>}
              </Typography>
            </ButtonBase>
          </CardContent>
          <IconButton onClick={() => setResultOpen(true)} aria-label="View result">
            <RemoveRedEye />
          </IconButton>
          <IconButton onClick={onDismiss} aria-label="Dismiss result">
            <Close />
          </IconButton>
        </Card>
      </Box>
    </>
  );
}
