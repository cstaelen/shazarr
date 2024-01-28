import { Search } from "@mui/icons-material";
import { Button } from "@mui/material";

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
