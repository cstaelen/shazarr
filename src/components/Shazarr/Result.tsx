import { useMemo } from "react";
import { Close } from "@mui/icons-material";
import { Box, Button, Divider, Drawer, Stack, Table, TableBody, TableCell, TableContainer, TableRow, useMediaQuery } from "@mui/material";
import { ShazamProvider } from "shazam-api/dist/types";

import { useConfigProvider } from "../Config/useConfig";

import ButtonLyrics from "./ui/ButtonLyrics";
import CardResult from "./ui/Card";
import CustomServiceButton from "./ui/CustomServiceButton";
import LidarrButton from "./ui/LidarrButton";
import StreamProviderButton from "./ui/StreamProviderButton";
import TidarrButton from "./ui/TidarrButton";
import { useShazarrProvider } from "./useShazarr";

export default function ShazarrResults() {
  const isLandscape = useMediaQuery("(orientation: landscape)");
  const {
    shazarrResponse,
    actions: { resetSearch },
  } = useShazarrProvider();

  const { config } = useConfigProvider();

  const albumName = shazarrResponse?.sections?.[0]?.metadata?.filter(
    (m: { title: string }) => m?.title === "Album",
  )?.[0]?.text;

  const lyrics = useMemo(
    () => shazarrResponse?.sections?.filter((section) => section.type === "LYRICS")?.[0]?.text,
    [shazarrResponse],
  );

  if (!shazarrResponse) return null;

  return (
    <Drawer
      anchor="bottom"
      open={!!shazarrResponse}
      onClose={() => resetSearch()}
      ModalProps={{
        keepMounted: true,
      }}
    >
      <Box sx={{p: 2, display: "flex", gap: 2, flexDirection: isLandscape ? "row" : "column"}}>
        <Box sx={{ flex: "1 1 0" }}>
          <CardResult data={shazarrResponse} />
        </Box>
        <Box sx={{ flex: "1 1 0" }}>
          <Stack spacing={2} sx={{ marginBottom: 2, maxWidth: 360,  }}>
            <TableContainer>
              <Table>
                <TableBody>
                  {shazarrResponse?.sections?.[0]?.metadata?.map((row, index) => (
                    <TableRow key={`metadata-${index}`}>
                      <TableCell component="th" scope="row">
                        <strong>{row.title}</strong>
                      </TableCell>
                      <TableCell align="right">{row.text}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <ButtonLyrics lyrics={lyrics} />

            {config?.lidarr_url && (
              <LidarrButton
                key={`lidarr-${shazarrResponse.key}`}
                albumTitle={albumName || shazarrResponse.title}
                artistName={shazarrResponse.subtitle}
                url={config.lidarr_url as string}
              />
            )}
            {config?.tidarr_url && (
              <TidarrButton
                key={`tidarr-${shazarrResponse.key}`}
                albumTitle={albumName || shazarrResponse.title}
                trackTitle={shazarrResponse.title}
                artistName={shazarrResponse.subtitle}
                url={config.tidarr_url as string}
              />
            )}
            {config?.custom_service_url && config?.custom_service_name && (
              <CustomServiceButton
                searchTerms={`${shazarrResponse.title} ${shazarrResponse.subtitle}`}
                url={config.custom_service_url as string}
                label={config.custom_service_name as string}
              />
            )}
            <Divider />

            <Box sx={{ textAlign: "center" }}>
              {shazarrResponse?.hub?.providers?.map(
                (provider: ShazamProvider, index: number) => (
                  <StreamProviderButton
                    key={`provider-${index}`}
                    uri={provider.actions?.[0]?.uri}
                    type={provider.type}
                  />
                ),
              )}

              {shazarrResponse?.myshazam?.apple?.actions?.[0]?.uri && (
                <StreamProviderButton
                  uri={shazarrResponse.myshazam.apple.actions?.[0]?.uri}
                  type="APPLE"
                />
              )}
            </Box>

            <Divider />

            <Button
              onClick={() => resetSearch()}
              variant="outlined"
              startIcon={<Close style={{ transform: "rotate(-180deg)" }} />}
            >
              Close
            </Button>
          </Stack>
        </Box>
      </Box>
    </Drawer>
  );
}
