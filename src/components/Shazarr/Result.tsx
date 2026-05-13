import { useMemo } from "react";
import { Close } from "@mui/icons-material";
import { Box, Button, Divider, Drawer, Stack, Table, TableBody, TableCell, TableContainer, TableRow, useMediaQuery } from "@mui/material";
import { ShazamProvider, ShazamTrack } from "shazam-api/dist/types";

import { useConfigProvider } from "../Config/useConfig";

import ButtonLyrics from "./ui/ButtonLyrics";
import CardResult from "./ui/Card";
import CustomServiceButton from "./ui/CustomServiceButton";
import LidarrButton from "./ui/LidarrButton";
import StreamProviderButton from "./ui/StreamProviderButton";
import TidarrButton from "./ui/TidarrButton";

interface Props {
  data: ShazamTrack | undefined;
  onClose: () => void;
}

export default function ShazarrResults({ data, onClose }: Props) {
  const isLandscape = useMediaQuery("(orientation: landscape)");
  const { config } = useConfigProvider();

  const albumName = data?.sections?.[0]?.metadata?.filter(
    (m: { title: string }) => m?.title === "Album",
  )?.[0]?.text;

  const lyrics = useMemo(
    () => data?.sections?.filter((section) => section.type === "LYRICS")?.[0]?.text,
    [data],
  );

  if (!data) return null;

  return (
    <Drawer
      anchor="bottom"
      open={!!data}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
    >
      <Box sx={{ p: 2, display: "flex", gap: 2, flexDirection: isLandscape ? "row" : "column" }}>
        <Box sx={{ flex: "1 1 0" }}>
          <CardResult data={data} onClose={onClose} />
        </Box>
        <Box sx={{ flex: "1 1 0" }}>
          <Stack spacing={2} sx={{ marginBottom: 2, maxWidth: 360 }}>
            <TableContainer>
              <Table>
                <TableBody>
                  {data?.sections?.[0]?.metadata?.map((row, index) => (
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
                key={`lidarr-${data.key}`}
                albumTitle={albumName || data.title}
                artistName={data.subtitle}
                url={config.lidarr_url as string}
              />
            )}
            {config?.tidarr_url && (
              <TidarrButton
                key={`tidarr-${data.key}`}
                albumTitle={albumName || data.title}
                trackTitle={data.title}
                artistName={data.subtitle}
                url={config.tidarr_url as string}
              />
            )}
            {config?.custom_service_url && config?.custom_service_name && (
              <CustomServiceButton
                searchTerms={`${data.title} ${data.subtitle}`}
                url={config.custom_service_url as string}
                label={config.custom_service_name as string}
              />
            )}
            <Divider />

            <Box sx={{ textAlign: "center" }}>
              {data?.hub?.providers?.map(
                (provider: ShazamProvider, index: number) => (
                  <StreamProviderButton
                    key={`provider-${index}`}
                    uri={provider.actions?.[0]?.uri}
                    type={provider.type}
                  />
                ),
              )}
              {data?.myshazam?.apple?.actions?.[0]?.uri && (
                <StreamProviderButton
                  uri={data.myshazam.apple.actions?.[0]?.uri}
                  type="APPLE"
                />
              )}
            </Box>

            <Divider />

            <Button
              onClick={onClose}
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
