import { useEffect, useState } from "react";
import { useTheme } from "@mui/material/styles";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardMedia from "@mui/material/CardMedia";
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
  const theme = useTheme();
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
      <Card sx={{ display: "flex" }} variant="elevation">
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flexGrow: "1",
            textAlign: "left",
          }}
        >
          <CardContent sx={{ flex: "1 0 auto" }}>
            <Typography
              component="div"
              variant="h6"
              lineHeight={1.2}
              marginBottom={1}
            >
              {data.title}
            </Typography>
            <Typography
              lineHeight={1.2}
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
              &nbsp;
              <Button
                onClick={() => reset()}
                variant="outlined"
                color="warning"
              >
                <Refresh style={{ transform: "rotate(-180deg)" }} />
              </Button>
            </Box>
          )}
        </Box>
        <Box
          sx={{
            flex: "0 0 auto",
          }}
        >
          <ImageWithFallback
            width="150"
            height="150"
            alt=""
            src={data.images.coverart}
          />
        </Box>
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
