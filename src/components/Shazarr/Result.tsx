import React from "react";
import { Close } from "@mui/icons-material";
import { Stack, Divider, Box, Button } from "@mui/material";
import TidarrButton from "./ui/TidarrButton";
import CardResult from "./ui/Card";
import StreamProviderButton from "./ui/StreamProviderButton";
import { useShazarrProvider } from "./Provider";
import { useConfigProvider } from "../Config/Provider";
import CustomServiceButton from "./ui/CustomServiceButton";
import LidarrButton from "./ui/LidarrButton";
import { ShazamProvider } from "shazam-api/dist/types";

export default function ShazarrResults() {
  const {
    shazarrResponse,
    actions: { resetSearch },
  } = useShazarrProvider();

  const { config } = useConfigProvider();

  const albumName = shazarrResponse?.sections?.[0]?.metadata?.filter(
    (m: { title: string }) => m?.title === "Album",
  )?.[0].text;

  if (!shazarrResponse) return null;

  return (
    <>
      <CardResult data={shazarrResponse} />
      <br />
      <Stack spacing={2} marginBottom={2}>
        {config?.lidarr_url && (
          <LidarrButton
            searchTerms={`${albumName} ${shazarrResponse.subtitle}`}
            url={config.lidarr_url as string}
          />
        )}
        {config?.tidarr_url && (
          <TidarrButton
            searchTerms={`${shazarrResponse.title} ${shazarrResponse.subtitle}`}
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

        <Box>
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
        <Divider />
      </Stack>
    </>
  );
}
