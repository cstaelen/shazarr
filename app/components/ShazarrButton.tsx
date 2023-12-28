"use client";

import useShazarr from "./useShazarr";
import CardResult from "./CardResult";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  Divider,
  IconButton,
  Stack,
} from "@mui/material";
import {
  Album,
  Check,
  MicOutlined,
  MoreHoriz,
  MoreHorizOutlined,
  MusicNote,
} from "@mui/icons-material";
import styled from "@emotion/styled";
import NotesAnimate from "./NotesAnimate";

export default function ShazarrButton() {
  const {
    shazarrLoading,
    shazarrResponse,
    recordingStatus,
    actions: { setRecordingStatus, resetSearch },
  } = useShazarr();

  function openTidar() {
    window.open(
      `http://tidarr.nas.docker/?query=${shazarrResponse?.track.title}+${shazarrResponse?.track.subtitle}`,
      "_blank"
    );
  }

  return (
    <Container maxWidth="xs">
      <Box marginY={3}>
        <Chip
          color={
            shazarrResponse?.track
              ? "success"
              : shazarrLoading || recordingStatus === "recording"
              ? "default"
              : shazarrResponse && !shazarrResponse?.track
              ? "warning"
              : "info"
          }
          icon={
            recordingStatus && recordingStatus !== "inactive" ? (
              <CircularProgress size={16} style={{ margin: "0 5px 0 10px" }} />
            ) : shazarrResponse?.track ? (
              <Check fontSize="small" />
            ) : (
              <MicOutlined fontSize="small" />
            )
          }
          label={
            recordingStatus && recordingStatus !== "inactive"
              ? `${recordingStatus}...`
              : shazarrResponse?.track
              ? "Found !"
              : shazarrResponse && !shazarrResponse?.track
              ? "Not found."
              : "Ready"
          }
          variant="outlined"
        />
      </Box>
      <Box marginY={3}>
        {shazarrResponse?.track && <CardResult data={shazarrResponse.track} />}
        <br />
        <main>
          {!shazarrResponse?.track ? (
            <Box marginTop={10}>
              <IconButton
                disabled={recordingStatus === "recording" || shazarrLoading}
                onClick={() => {
                  resetSearch();
                  setRecordingStatus("start");
                }}
              >
                <Round
                  isAnimate={recordingStatus === "recording" || shazarrLoading}
                >
                  {shazarrLoading ? (
                    <MoreHorizOutlined fontSize="large" />
                  ) : (
                    <MicOutlined fontSize="large" />
                  )}
                </Round>
              </IconButton>
            </Box>
          ) : (
            <>
              <Stack spacing={2}>
                <Button
                  variant="contained"
                  startIcon={<Album />}
                  onClick={() => openTidar()}
                >
                  Download with Tidarr
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Album />}
                  onClick={() => openTidar()}
                >
                  Download with Lidarr
                </Button>
                <Divider />
                <Button onClick={() => resetSearch()} variant="outlined">
                  Reset
                </Button>
              </Stack>
            </>
          )}
        </main>
      </Box>
    </Container>
  );
}

const Round = styled.div<{ isAnimate: boolean }>`
  background: #fff;
  border-radius: 100%;
  line-height: 0;
  padding: 2rem;
  position: relative;

  svg {
    fill: black;
  }

  &:before {
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 100%;
    content: "";
    height: 7rem;
    width: 7rem;
    position: absolute;
    left: 50%;
    top: 50%;
    margin-left: -3.5rem;
    margin-top: -3.5rem;
    z-index: -1;
    animation: ${({ isAnimate }) =>
      isAnimate ? "button-animate 2s infinite linear" : "none"};
    transition: transform 300ms ease;
  }

  @keyframes button-animate {
    0% {
      transform: scale(1.2);
    }
    10% {
      transform: scale(1.4);
    }
    20% {
      transform: scale(1.3);
    }
    30% {
      transform: scale(1.5);
    }
    40% {
      transform: scale(1.3);
    }
    50% {
      transform: scale(1.2);
    }
    60% {
      transform: scale(1.2);
    }
    70% {
      transform: scale(1.4);
    }
    80% {
      transform: scale(1.3);
    }
    90% {
      transform: scale(1.5);
    }
    100% {
      transform: scale(1.2);
    }
  }
`;
