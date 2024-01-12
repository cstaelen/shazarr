"use client";

import useShazarr from "./useShazarr";
import CardResult from "./CardResult";
import {
  Alert,
  Box,
  Button,
  Divider,
  IconButton,
  Stack,
} from "@mui/material";
import { MoreHorizOutlined, Refresh } from "@mui/icons-material";
import styled from "@emotion/styled";
import LidarrDownload from "../Lidarr/LidarrDownload";
import TidarrButton from "../Tidarr/TidarrButton";
import StatusChip from "./StatusChip";
import StreamProviderButton from "./StreamProviderButton";
import React from "react";
import { ShazamProviderType } from "../../types";

import skullImage from "../../assets/skull.png";

export default function ShazarrButton() {
  const {
    config,
    apiError,
    shazarrLoading,
    shazarrResponse,
    recordingStatus,
    actions: { setRecordingStatus, resetSearch },
  } = useShazarr();

  const albumName = shazarrResponse?.track?.sections?.[0]?.metadata?.filter(
    (m: any) => m?.title === "Album"
  )?.[0].text;

  if (apiError)
    return (
      <Box marginY={5} textAlign="left">
        <Alert severity="error">
          An error occured while connection to Shazarr API. Please, check your
          API configuration.
        </Alert>
      </Box>
    );

  return (
    <>
      <Box marginY={3}>
        <StatusChip
          recordingStatus={recordingStatus}
          loading={shazarrLoading}
          shazarrResponse={shazarrResponse}
        />
      </Box>
      <Box>
        {shazarrResponse?.track && (
          <CardResult data={shazarrResponse.track} reset={resetSearch} />
        )}
        <br />
        <main>
          {!shazarrResponse?.track ? (
            <ListenButton>
              <IconButton
                onClick={() => {
                  resetSearch();
                  if (recordingStatus === "inactive") {
                    setRecordingStatus("start");
                  }
                }}
              >
                <Round
                  isAnimate={recordingStatus === "recording" || shazarrLoading}
                >
                  {shazarrLoading ? (
                    <MoreHorizOutlined fontSize="large" />
                  ) : (
                    <img
                      src={skullImage}
                      alt=""
                      width="35"
                      style={{ transform: "scale(1.8)" }}
                    />
                  )}
                </Round>
              </IconButton>
            </ListenButton>
          ) : (
            <>
              <Stack spacing={2}>
                {config?.TIDARR_URL && (
                  <TidarrButton
                    searchTerms={`${shazarrResponse?.track.title} ${shazarrResponse?.track.subtitle}`}
                    url={config.TIDARR_URL as string}
                  />
                )}
                {config?.LIDARR_ENABLED && (
                  <LidarrDownload
                    searchTerms={`${albumName} ${shazarrResponse?.track.subtitle}`}
                  />
                )}

                <Divider />

                <Box>
                  {shazarrResponse?.track?.hub?.providers?.map(
                    (provider: ShazamProviderType, index: number) => (
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
    </>
  );
}

const ListenButton = styled.div`
  height: calc(100vh - 250px);
  align-items: center;
  display: flex;
  justify-content: center;
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

  img {
    animation: ${({ isAnimate }) =>
      isAnimate ? "button-animate 2s infinite linear" : "none"};
  }

  @keyframes button-animate {
    0% {
      transform: scale(1.2);
    }
    10% {
      transform: scale(1.4), rotate(-30deg);
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
      transform: scale(1.2), rotate(30deg);
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
