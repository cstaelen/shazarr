import { Close } from "@mui/icons-material";
import { Stack, Divider, Box, Button } from "@mui/material";
import { ShazamProviderType } from "../../types";
import LidarrDownload from "../Lidarr/LidarrDownload";
import TidarrButton from "./ui/TidarrButton";
import CardResult from "./ui/Card";
import StreamProviderButton from "./ui/StreamProviderButton";
import { useShazarrProvider } from "./Provider";
import { useConfigProvider } from "../Config/Provider";

export default function ShazarrResults() {
  const {
    shazarrResponse,
    actions: { resetSearch },
  } = useShazarrProvider();

  const { config } = useConfigProvider();

  const albumName = shazarrResponse?.track?.sections?.[0]?.metadata?.filter(
    (m: any) => m?.title === "Album"
  )?.[0].text;

  if (!shazarrResponse) return null;

  return (
    <>
      <CardResult data={shazarrResponse.track} />
      <br />
      <Stack spacing={2} marginBottom={2}>
        {config?.tidarr_url && (
          <TidarrButton
            searchTerms={`${shazarrResponse?.track.title} ${shazarrResponse?.track.subtitle}`}
            url={config.tidarr_url as string}
          />
        )}
        {config?.lidarr_url &&
          config?.lidarr_api_key &&
          config?.lidarr_library_path && (
            <LidarrDownload
              searchTerms={`${albumName} ${shazarrResponse?.track.subtitle}`}
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
            )
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
