"use client";

import { Stack } from "@mui/material";
import { MusicNote } from "@mui/icons-material";
import { ReactElement, useEffect, useState } from "react";
import styled from "@emotion/styled";

const Math2 = {
  randomCeil: function (number: number) {
    return Math.ceil(Math.random() * number);
  },
};

const Note = () => {
  const topScale = 120;
  const newScale = Math2.randomCeil(topScale);
  const topPos = window.innerHeight + newScale;
  const leftPos = window.innerWidth + newScale;

  // const styles = ;
  return (
    <MusicNoteStyled
      style={{
        top: Math2.randomCeil(topPos),
        left: Math2.randomCeil(leftPos),
        width: newScale,
        height: newScale,
      }}
    />
  );
};

export default function NotesAnimate({
  duration,
  run,
}: {
  duration: number;
  run: boolean;
}) {
  const [notes, setNotes] = useState<ReactElement[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    if (run) {
      setIsRunning(true);
      if (!isRunning) {
        const animationInterval = setInterval(
          () => setNotes((notes) => [...notes, <Note key={notes.length} />]),
          100
        );

        setTimeout(() => {
          clearInterval(animationInterval);
          setIsRunning(false);
        }, duration);
      }
    }
  }, [run]);

  return (
    <Stack>
      {notes.map((note) => (
        <>{note}</>
      ))}
    </Stack>
  );
}

const MusicNoteStyled = styled(MusicNote)`
  animation: noteAnimation 1200ms cubic-bezier(0.47, 0, 0.745, 0.715) forwards;
  opacity: 0;
  position: absolute;
  z-index: -1;
  text-shadow: 10px 10px #fff;
  transform: translate(-50%, -50%);

  @keyframes noteAnimation {
    0% {
      opacity: 0;
    }
    20% {
      opacity: 0.6;
    }
    90% {
      opacity: 0.2;
    }
    100% {
      opacity: 0;
      top: 60%;
      left: 50%;
      height: 0;
      width: 0;
    }
  }
`;
