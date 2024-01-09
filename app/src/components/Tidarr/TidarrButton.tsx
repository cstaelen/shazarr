import { Album } from "@mui/icons-material";
import { Button, styled } from "@mui/material";
import React from "react";

export default function TidarrButton({ searchTerms }: { searchTerms: string }) {
  function openTidar() {
    window.open(
      `${process.env.NEXT_PUBLIC_TIDARR_URL}/?query=${searchTerms}`,
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
