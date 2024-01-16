import { Album } from "@mui/icons-material";
import { Button, styled } from "@mui/material";

export default function TidarrButton({
  searchTerms,
  url,
}: {
  searchTerms: string;
  url: string;
}) {
  function openTidar() {
    window.open(
      `${url}/?query=${searchTerms}`,
      "_blank"
    );
  }

  return (
    <Button
      variant="contained"
      startIcon={<AlbumStyled />}
      onClick={() => openTidar()}
    >
      <strong>Download with Tidarr</strong>
    </Button>
  );
}

const AlbumStyled = styled(Album)`
  font-size: 32px !important;
`;
