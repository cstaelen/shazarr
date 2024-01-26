import { Album, Search } from "@mui/icons-material";
import { Button, styled } from "@mui/material";

export default function CustomServiceButton({
  searchTerms,
  url,
  label,
}: {
  searchTerms: string;
  url: string;
  label: string;
}) {
  function openTidar() {
    window.open(`${url}${searchTerms}`, "_blank");
  }

  return (
    <Button
      variant="contained"
      startIcon={<Search />}
      onClick={() => openTidar()}
    >
      <strong>{label}</strong>
    </Button>
  );
}

const AlbumStyled = styled(Album)`
  font-size: 32px !important;
`;
