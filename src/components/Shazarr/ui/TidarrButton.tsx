import React from "react";
import { Album } from "@mui/icons-material";
import { Button, styled } from "@mui/material";

import { useConfigProvider } from "../../Config/Provider";

export default function TidarrButton({
  searchTerms,
  url,
}: {
  searchTerms: string;
  url: string;
}) {
  const { isNetworkConnected } = useConfigProvider();

  function openTidar() {
    window.open(`${url}/?query=${encodeURIComponent(searchTerms)}`, "_blank");
  }

  return (
    <Button
      variant="contained"
      disabled={!isNetworkConnected}
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
