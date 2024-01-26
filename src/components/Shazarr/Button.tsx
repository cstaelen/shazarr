"use client";

import { Box, IconButton } from "@mui/material";
import { MoreHorizOutlined } from "@mui/icons-material";
import styled from "@emotion/styled";
import SpeakerIcon from "@mui/icons-material/Speaker";
// import FingerprintIcon from "@mui/icons-material/Fingerprint";

import skullImage from "../../resources/skull.png";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import NotesAnimate from "../NotesAnimate/NotesAnimate";
import { useShazarrProvider } from "./Provider";
import ShazarrResults from "./Result";
import { RECORD_DURATION } from "../../constant";

export default function ShazarrButton() {
  const {
    shazarrLoading,
    shazarrResponse,
    recordingStatus,
    actions: { setRecordingStatus, resetSearch },
  } = useShazarrProvider();

  return (
    <Box width="100%" sx={{ position: "relative" }}>
      {recordingStatus !== "inactive" ? (
        <NotesAnimate
          duration={RECORD_DURATION}
          run={recordingStatus === "recording"}
        />
      ) : null}
      {!shazarrResponse?.track ? (
        <>
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
                {recordingStatus === "searching" ? (
                  <MoreHorizOutlined
                    style={{ transform: "scale(1.6)", opacity: 0.5 }}
                  />
                ) : recordingStatus === "recording" ? (
                  <GraphicEqIcon
                    style={{ transform: "scale(1.6)", opacity: 0.5 }}
                  />
                ) : (
                  <>
                    {/*
                  <FingerprintIcon
                  width="35"
                  style={{ transform: "scale(1.6)", opacity: 0.5 }}
                  />
                */}
                    <img
                      src={skullImage}
                      alt=""
                      height="35"
                      width="35"
                      style={{ transform: "scale(1.6)", lineHeight: 0 }}
                    />
                  </>
                )}
              </Round>
            </IconButton>
          </ListenButton>
        </>
      ) : (
        <ShazarrResults />
      )}
    </Box>
  );
}

const ListenButton = styled.div`
  position: relative;
  z-index: 10;
`;

const Round = styled.div<{ isAnimate: boolean }>`
  align-items: center;
  background: #fff;
  border-radius: 100%;
  display: flex;
  justify-content: center;
  line-height: 0;
  padding: 2rem;
  position: relative;
  height: 6rem;
  width: 6rem;

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
    z-index: 0;
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
