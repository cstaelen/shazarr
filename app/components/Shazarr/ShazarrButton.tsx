"use client";

import useShazarr from "./useShazarr";
import CardResult from "./CardResult";
import {
  Box,
  Button,
  Container,
  Divider,
  IconButton,
  Stack,
} from "@mui/material";
import {
  Delete,
  DeleteSweep,
  MicOutlined,
  MoreHorizOutlined,
  Refresh,
  Rule,
} from "@mui/icons-material";
import styled from "@emotion/styled";
import LidarrDownload from "../Lidarr/LidarrDownload";
import TidarrButton from "../Tidarr/TidarrButton";
import StatusChip from "./StatusChip";
import StreamProviderButton from "./StreamProviderButton";

export default function ShazarrButton() {
  const {
    shazarrLoading,
    shazarrResponse,
    recordingStatus,
    actions: { setRecordingStatus, resetSearch },
  } = useShazarr();

  const albumName = shazarrResponse?.track?.sections?.[0]?.metadata?.filter(
    (m) => m?.title === "Album"
  )?.[0].text;

  return (
    <Container maxWidth="xs">
      <Box marginY={3}>
        <StatusChip
          recordingStatus={recordingStatus}
          loading={shazarrLoading}
          shazarrResponse={shazarrResponse}
        />
      </Box>
      <Box marginBottom={10}>
        {shazarrResponse?.track && (
          <CardResult data={shazarrResponse.track} reset={resetSearch} />
        )}
        <br />
        <main>
          {!shazarrResponse?.track ? (
            <ListenButton>
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
            </ListenButton>
          ) : (
            <>
              <Stack spacing={2}>
                <TidarrButton
                  searchTerms={`${shazarrResponse?.track.title} ${shazarrResponse?.track.subtitle}`}
                />
                <LidarrDownload
                  searchTerms={`${albumName} ${shazarrResponse?.track.subtitle}`}
                />

                <Divider />

                <Box>
                  {shazarrResponse?.track?.hub?.providers?.map(
                    (provider, index) => (
                      <StreamProviderButton
                        key={`provider-${index}`}
                        uri={provider.actions?.[0]?.uri}
                        caption={provider.caption}
                        type={provider.type}
                      />
                    )
                  )}

                  {shazarrResponse?.track?.myshazam?.apple?.actions?.[0]
                    ?.uri && (
                    <StreamProviderButton
                      uri={
                        shazarrResponse.track.myshazam.apple.actions?.[0]?.uri
                      }
                      caption="Open with Apple Music"
                      type="APPLE"
                    />
                  )}
                </Box>

                <Divider />

                <Button
                  onClick={() => resetSearch()}
                  variant="outlined"
                  startIcon={
                    <Refresh style={{ transform: "rotate(-180deg)" }} />
                  }
                >
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

const ListenButton = styled.div`
  bottom: 20vh;
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
`;

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
