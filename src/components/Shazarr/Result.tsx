import { Close } from "@mui/icons-material";
import { Stack, Divider, Box, Button } from "@mui/material";
import { ShazamProviderType } from "../../types";
import TidarrButton from "./ui/TidarrButton";
import CardResult from "./ui/Card";
import StreamProviderButton from "./ui/StreamProviderButton";
import { useShazarrProvider } from "./Provider";
import { useConfigProvider } from "../Config/Provider";
import CustomServiceButton from "./ui/CustomServiceButton";
import LidarrButton from "./ui/LidarrButton";

export default function ShazarrResults() {
  const {
    shazarrResponse,
    actions: { resetSearch },
  } = useShazarrProvider();

  const { config } = useConfigProvider();

  const albumName = shazarrResponse?.track?.sections?.[0]?.metadata?.filter(
    (m: { title: string }) => m?.title === "Album",
  )?.[0].text;

  if (!shazarrResponse) return null;

  return (
    <>
      <CardResult data={shazarrResponse.track} />
      <br />
      <Stack spacing={2} marginBottom={2}>
        {config?.lidarr_url && (
          <LidarrButton
            searchTerms={`${albumName} ${shazarrResponse?.track.subtitle}`}
            url={config.lidarr_url as string}
          />
        )}
        {config?.tidarr_url && (
          <TidarrButton
            searchTerms={`${shazarrResponse?.track.title} ${shazarrResponse?.track.subtitle}`}
            url={config.tidarr_url as string}
          />
        )}
        {config?.custom_service_url && config?.custom_service_name && (
          <CustomServiceButton
            searchTerms={`${shazarrResponse?.track.title} ${shazarrResponse?.track.subtitle}`}
            url={config.custom_service_url as string}
            label={config.custom_service_name as string}
          />
        )}
        <Divider />

        <Box>
          {shazarrResponse?.track?.hub?.providers?.map(
            (provider: ShazamProviderType, index: number) => (
              <StreamProviderButton
                key={`provider-${index}`}
                uri={provider.actions?.[0]?.uri}
                type={provider.type}
              />
            ),
          )}

          {shazarrResponse?.track?.myshazam?.apple?.actions?.[0]?.uri && (
            <StreamProviderButton
              uri={shazarrResponse.track.myshazam.apple.actions?.[0]?.uri}
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
