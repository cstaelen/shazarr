import React from "react";
import { Button } from "@mui/material";

import lidarrLogo from "../../../resources/lidarr.png";
import { useConfigProvider } from "../../Config/Provider";

export default function LidarrButton({
  searchTerms,
  url,
}: {
  searchTerms: string;
  url: string;
}) {
  const { isNetworkConnected } = useConfigProvider();

  function openTidar() {
    window.open(
      `${url}/add/search?term=${encodeURIComponent(searchTerms)}`,
      "_blank",
    );
  }

  return (
    <Button
      variant="contained"
      disabled={!isNetworkConnected}
      startIcon={<img src={lidarrLogo} alt="" width="32" height="32" />}
      onClick={() => openTidar()}
    >
      <strong>Download with Lidarr</strong>
    </Button>
  );
}
