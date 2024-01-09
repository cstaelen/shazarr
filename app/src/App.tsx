import { useEffect, useRef, useState } from "react";
import ShazarrButton from "./components/Shazarr/ShazarrButton";
import { ThemeProvider } from "@emotion/react";
import {
  CssBaseline,
  Container,
  Box,
  Input,
  Button,
  createTheme,
} from "@mui/material";
import styled from "@emotion/styled";
import { Storage, Database } from "@ionic/storage";

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
  const [apiUrl, setApiUrl] = useState<string>();
  const [showApiForm, setShowApiForm] = useState<boolean>();
  const inputRef = useRef<HTMLInputElement>();
  const [db, setDb] = useState<Database | null>(null);

  async function saveApiUrl() {
    if (inputRef.current) {
      const url = inputRef.current.querySelector("input")?.value;
      setApiUrl(url);
      setShowApiForm(false);
      await db.set("shazarr_api_url", url);
    }
  }

  async function handleApiURL() {
    const existingUrl = await db.get("shazarr_api_url");

    if (
      !existingUrl &&
      process.env.REACT_APP_HOSTNAME &&
      process.env.REACT_APP_API_PORT
    ) {
      const url = `${process.env.REACT_APP_HOSTNAME}:${process.env.REACT_APP_API_PORT}`;
      setApiUrl(url);
      await db.set("shazarr_api_url", url);
    } else {
      setApiUrl(existingUrl);
    }
  }

  useEffect(() => {
    async function initDb() {
      const store = new Storage();

      const db = await store.create();

      setDb(db);
    }

    initDb();
    setAppLoaded(true);
  }, []);

  useEffect(() => {
    if (db) {
      handleApiURL();
    }
  }, [db]);

  if (!appLoaded) return null;

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Main>
        <Container maxWidth="xs">
          <H1>Shazarr</H1>- ShazamIO web UI -
          {!apiUrl || showApiForm ? (
            <Box marginTop={10}>
              <Box marginBottom={2}>
                <Input
                  type="text"
                  defaultValue={apiUrl}
                  placeholder="Shazarr API URL (http://...:12358)"
                  fullWidth
                  ref={inputRef}
                />
              </Box>
              <Box>
                <Button variant="contained" onClick={() => saveApiUrl()}>
                  Save API URL
                </Button>
              </Box>
            </Box>
          ) : (
            <>
              <ShazarrButton />
              <ButtonConfig>
                <Button onClick={() => setShowApiForm(true)}>
                  Show server configuration
                </Button>
              </ButtonConfig>
            </>
          )}
        </Container>
      </Main>
    </ThemeProvider>
  );
}

export default App;

const H1 = styled.h1`
  letter-spacing: 4px;
  margin-bottom: 0;
  text-transform: uppercase;
`;

const ButtonConfig = styled.div``;

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
