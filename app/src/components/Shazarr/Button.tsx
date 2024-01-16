"use client";

import { Box, IconButton } from "@mui/material";
import { MoreHorizOutlined } from "@mui/icons-material";
import styled from "@emotion/styled";

import skullImage from "../../resources/skull.png";
import NotesAnimate from "../NotesAnimate/NotesAnimate";
import { RECORD_DURATION, useShazarrProvider } from "./Provider";
import ShazarrResults from "./Result";

export default function ShazarrButton() {
  const {
    shazarrLoading,
    shazarrResponse,
    recordingStatus,
    actions: { setRecordingStatus, resetSearch },
  } = useShazarrProvider();

  return (
    <>
      {recordingStatus !== "inactive" ? (
        <NotesAnimate
          duration={RECORD_DURATION}
          run={recordingStatus === "granted"}
        />
      ) : null}
      <Box>
        <main>
          {!shazarrResponse?.track ? (
            <ListenButton style={{ marginTop: "10vh" }}>
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
            <ShazarrResults />
          )}
        </main>
      </Box>
    </>
  );
}

const ListenButton = styled.div``;

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
