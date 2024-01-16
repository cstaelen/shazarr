import { useEffect, useState } from "react";
import ShazarrButton from "./components/Shazarr/ShazarrButton";
import { ThemeProvider } from "@emotion/react";
import { CssBaseline, Container, createTheme } from "@mui/material";
import styled from "@emotion/styled";
import { HistoryProvider } from "./components/History/HistoryProvider";
import { ShazarrProvider } from "./components/Shazarr/ShazarrProvider";
import FormApi from "./components/FormApi";
import HistoryList from "./components/History/HistoryList";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "#153b50",
      paper: "#0a1d28",
    },
  },
});

function App() {
  const [appLoaded, setAppLoaded] = useState(false);

  useEffect(() => {
    setAppLoaded(true);
  }, []);

  if (!appLoaded) return null;

  return (
    <ThemeProvider theme={darkTheme}>
      <HistoryProvider>
        <ShazarrProvider>
          <CssBaseline />
          <Main>
            <Container maxWidth="xs">
              <H1>Shazarr</H1>- ShazamIO web UI -
              <ShazarrButton />
              <FormApi />
              <HistoryList />
            </Container>
          </Main>
        </ShazarrProvider>
      </HistoryProvider>
    </ThemeProvider>
  );
}

export default App;

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
