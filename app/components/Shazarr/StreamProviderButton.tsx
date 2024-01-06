import { ShazamProviderType } from "@/app/types";
import { Headphones, OpenInNew } from "@mui/icons-material";
import { Button } from "@mui/material";

export default function StreamProviderButton({
  caption,
  uri,
  type,
}: {
  caption: string;
  uri?: string;
  type: string;
}) {
  function handleClick() {
    if (uri) {
      window.open(uri);
    }
  }
  return (
    <Button
      startIcon={<Headphones />}
      onClick={handleClick}
      style={{
        background: type === "SPOTIFY" ? "#18d860" : type === "DEEZER" ? "#a239ff" : "#fff",
        color: type === "DEEZER" ? "#fff" : type === "APPLE" ? "#fa586a" : "#212121",
        fontWeight: "bold",
        margin: "0.25rem",
      }}
    > 
      {type}
    </Button>
  );
}
