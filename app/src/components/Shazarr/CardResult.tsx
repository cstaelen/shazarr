import React, { useEffect, useState } from "react";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { ShazamioTrackType } from "../../types";
import {
  ExpandMore,
  PauseCircleFilled,
  PlayCircleFilled,
  Refresh,
} from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  CardActions,
  CardMedia,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
} from "@mui/material";
import { ImageWithFallback } from "../Common/ImageWithFallback";

export default function CardResult({
  data,
  reset,
}: {
  data: ShazamioTrackType;
  reset: () => void;
}) {
  const [sample, setSample] = useState<HTMLAudioElement>();
  const [lyrics, setLyrics] = useState<string[]>();
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

    const dataLyrics = data?.sections?.filter(
      (section) => section.type === "LYRICS"
    )?.[0]?.text;
    if (dataLyrics) {
      setLyrics(dataLyrics);
    }
  }, [data]);

  return (
    <>
      <Card sx={{ maxWidth: 260, margin: "0 auto 1rem" }}>
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
                onClick={() => reset()}
                variant="outlined"
                color="warning"
              >
                <Refresh style={{ transform: "rotate(-180deg)" }} />
              </Button>
            </Box>
          </CardActions>
        )}
      </Card>

      <TableContainer>
        <Table>
          <TableBody>
            {data?.sections?.[0]?.metadata?.map((row, index) => (
              <TableRow key={`metadata-${index}`}>
                <TableCell component="th" scope="row">
                  <strong>{row.title}</strong>
                </TableCell>
                <TableCell align="right">{row.text}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {lyrics && lyrics?.length > 0 && (
        <Box marginTop={2}>
          <Accordion>
            <AccordionSummary
              expandIcon={<ExpandMore />}
              aria-controls="panel1a-content"
              id="panel1a-header"
            >
              <Typography>LYRICS</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography>
                {lyrics?.map((lyric) => (
                  <>
                    {lyric}
                    <br />
                  </>
                ))}
              </Typography>
            </AccordionDetails>
          </Accordion>
        </Box>
      )}
    </>
  );
}
