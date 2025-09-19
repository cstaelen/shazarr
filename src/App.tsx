import React, { useEffect, useState } from "react";
import { Device } from "@capacitor/device";
import { ThemeProvider } from "@emotion/react";
import styled from "@emotion/styled";
import {
  Box,
  Container,
  createTheme,
  CssBaseline,
  Stack,
  Typography,
} from "@mui/material";

import Config from "./components/Config";
import { ConfigProvider } from "./components/Config/Provider";
import HistoryList from "./components/History/List";
import { HistoryProvider } from "./components/History/Provider";
import ShazarrButton from "./components/Shazarr/Button";
import { ShazarrProvider } from "./components/Shazarr/Provider";
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
  const [devideOS, setDevideOS] = useState<"ios" | "android" | "web">();

  const getDeviceOS = async () => {
    const { platform } = await Device.getInfo();
    setDevideOS(platform);
  };

  useEffect(() => {
    setAppLoaded(true);
    getDeviceOS();
  }, []);

  if (!appLoaded) return null;

  return (
    <ThemeProvider theme={darkTheme}>
      <ConfigProvider>
        <HistoryProvider>
          <ShazarrProvider>
            <CssBaseline />
            <Main>
              <Container maxWidth="xs">
                <StackStyled direction="column" os={devideOS}>
                  <Box>
                    <H1>Shazarr</H1>
                    <Typography component="h2" marginBottom={2}>
                      - Offroad Shazam app -
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
                  <Box sx={{pb: 4}}>
                    <Config />
                    <HistoryList />
                  </Box>
                </StackStyled>
              </Container>
            </Main>
          </ShazarrProvider>
        </HistoryProvider>
      </ConfigProvider>
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
  display: flex;
  margin: 0;
  text-align: center;
  min-height: 100vh;
`;

const StackStyled = styled(Stack)<{
  os: "ios" | "android" | "web" | undefined;
}>`
  min-height: 100vh;
  padding: ${({ os }) => (os === "ios" ? "3rem 0" : 0)};
`;
