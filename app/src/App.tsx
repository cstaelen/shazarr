import { useEffect, useState } from "react";
import ShazarrButton from "./components/Shazarr/Button";
import { ThemeProvider } from "@emotion/react";
import {
  CssBaseline,
  Container,
  createTheme,
  Stack,
  Box,
  Typography,
} from "@mui/material";
import styled from "@emotion/styled";
import { HistoryProvider } from "./components/History/Provider";
import { ShazarrProvider } from "./components/Shazarr/Provider";
import FormApi from "./components/FormApi/Form";
import HistoryList from "./components/History/List";
import StatusChip from "./components/Shazarr/ui/StatusChip";

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
              <Stack direction="column" minHeight={`100vh`}>
                <Box>
                  <H1>Shazarr</H1>
                  <Typography component="h2" marginBottom={2}>
                    - ShazamIO web UI -
                  </Typography>
                  <StatusChip />
                </Box>
                <Box
                  marginTop={3}
                  flex="1 1 0"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <ShazarrButton />
                </Box>
                <Box>
                  <FormApi />
                  <HistoryList />
                </Box>
              </Stack>
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
  margin: 0;
  text-align: center;
  min-height: 100vh;
`;
