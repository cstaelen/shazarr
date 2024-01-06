"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import styled from "@emotion/styled";
import { useEffect, useState } from "react";
import ShazarrButton from "./components/Shazarr/ShazarrButton";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#153b50",
      paper: "#0a1d28",
    },
  },
});

export default function Home() {
  const [appLoaded, setAppLoaded] = useState(false);

  useEffect(() => setAppLoaded(true), []);

  if (!appLoaded) return;

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Main>
        <H1>Shazarr</H1>
        - ShazamIO web UI -
        <ShazarrButton />
      </Main>
      <Support>
        👋 Private use only.
        <br />
        Do not forget to support your local artists 🙏❤️
      </Support>
    </ThemeProvider>
  );
}

const Support = styled.div`
  background-color: rgb(144, 202, 249);
  color: #393939;
  display: none;
  font-size: 0.725rem;
  font-weight: bold;
  line-height: 0.825rem;
  padding: 0.3rem;
  position: fixed;
  text-align: center;
  bottom: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
`;

const H1 = styled.h1`
  letter-spacing: 4px;
  margin-bottom: 0;
  text-transform: uppercase;
`;

const Main = styled.main`
  background-image: linear-gradient(180deg, #153b50 0%, #0a1d28 100%);
  margin: 0 0 3rem 0;
  text-align: center;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100vh;
  overflow: auto;
`;
