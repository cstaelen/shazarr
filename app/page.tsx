"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import styled from "@emotion/styled";
import { useEffect, useState } from "react";
import Shazarr from "./components/Shazarr/ShazarrButton";
import { Container } from "@mui/material";
import ShazarrButton from "./components/Shazarr/ShazarrButton";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
  },
});

export default function Home() {
  const [appLoaded, setAppLoaded] = useState(false);

  useEffect(() => setAppLoaded(true), []);

  if (!appLoaded) return;

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <main className="flex min-h-screen flex-col items-center justify-between">
        <div className="relative">
          <Content>
            <H1>Shazarr</H1>
            - ShazamIO web UI -
            <ShazarrButton />
          </Content>
        </div>
      </main>
      <Support>
        👋 Private use only. Do not forget to support your local artists 🙏❤️
      </Support>
    </ThemeProvider>
  );
}

const Support = styled.div`
  background-color: rgb(144, 202, 249);
  color: #393939;
  font-weight: bold;
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

const Content = styled.div`
  margin: 0 0 3rem 0;
  text-align: center;
`;
