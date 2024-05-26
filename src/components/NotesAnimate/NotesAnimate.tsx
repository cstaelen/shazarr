import React from "react";
import { ReactElement, useEffect, useState } from "react";
import styled from "@emotion/styled";
import { Stack } from "@mui/material";

import { IconNote1, IconNote2, IconNote3, IconNote4, IconNote5 } from "./Icons";

const Math2 = {
  randomCeil: function (number: number) {
    return Math.ceil(Math.random() * number);
  },
};

function randomIntFromInterval(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

const Note = () => {
  const topScale = 120;
  const newScale = Math2.randomCeil(topScale);
  const topPos = window.innerHeight + newScale;
  const leftPos = window.innerWidth + newScale;

  const iconIndex = randomIntFromInterval(0, 5);
  const styles = {
    top: Math2.randomCeil(topPos),
    left: Math2.randomCeil(leftPos),
    width: newScale,
    height: newScale,
    animation:
      "noteAnimation 1000ms cubic-bezier(0.47, 0, 0.745, 0.715) forwards",
    opacity: 0,
    position: "absolute",
    textShadow: "10px 10px #000",
    transform: "translate(-50%, -50%)",
  };
  const Icons = [
    <IconNote1 key="note1" sx={styles} />,
    <IconNote2 key="note2" sx={styles} />,
    <IconNote3 key="note3" sx={styles} />,
    <IconNote4 key="note4" sx={styles} />,
    <IconNote5 key="note5" sx={styles} />,
  ];

  return Icons[iconIndex];
};

export default function NotesAnimate({ duration }: { duration: number }) {
  const [notes, setNotes] = useState<ReactElement[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    if (!isRunning && duration > 0) {
      setIsRunning(true);

      const animationInterval = setInterval(
        () => setNotes((notes) => [...notes, <Note key={notes.length} />]),
        50,
      );

      setTimeout(() => {
        clearInterval(animationInterval);
      }, duration - 1000);
    }
  }, [isRunning, duration]);

  return (
    <Wrapper>
      <Stack>
        {notes.map((note, index) => (
          <div key={`node-${index}`}>{note}</div>
        ))}
      </Stack>
    </Wrapper>
  );
}

const Wrapper = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100vh;
  overflow: hidden;
  z-index: 0;

  @keyframes noteAnimation {
    0% {
      opacity: 0;
    }
    20% {
      opacity: 0.1;
    }
    90% {
      opacity: 0.7;
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
