"use client";

import { Stack } from "@mui/material";
import { MusicNote } from "@mui/icons-material";
import React, { ReactElement, useEffect, useState } from "react";

export default function NotesAnimate({ duration }: { duration: number }) {
  const [notes, setNotes] = useState<ReactElement[]>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    setIsRunning(true);
    if (!isRunning) {
      const animationInterval = setInterval(
        () => setNotes((notes) => [...notes, <MusicNote key={notes.length} />]),
        500
      );

      setTimeout(() => {
        clearInterval(animationInterval);
        setNotes([]);
        setIsRunning(false);
      }, duration);
    }
  }, []);

  return (
    <Stack>
      {notes.map((note) => (
        <>{note}</>
      ))}
    </Stack>
  );
}
