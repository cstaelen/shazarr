import { CloseOutlined } from "@mui/icons-material";
import { Button, CircularProgress } from "@mui/material";
import { AlbumsLoader } from "../Skeletons/AlbumsLoader";
import AlbumCard from "./AlbumCard";
import useLidarr from "./useLidarr";
import React from "react";
import lidarrLogo from "../../resources/lidarr.png";
import { useConfigProvider } from "../Config/Provider";

export default function LidarrDownload({
  searchTerms,
}: {
  searchTerms: string;
}) {
  const {
    loading: lidarrLoading,
    results: lidarrResults,
    actions: { searchAlbum },
  } = useLidarr();
  const { isNetworkConnected } = useConfigProvider();

  return (
    <>
      <Button
        variant="contained"
        startIcon={
          lidarrLoading ? (
            <CircularProgress size={32} />
          ) : (
            <img src={lidarrLogo} alt="" width="32" height="32" />
          )
        }
        endIcon={
          lidarrResults && lidarrResults?.length > 0 ? (
            <CloseOutlined />
          ) : undefined
        }
        disabled={lidarrLoading || !isNetworkConnected}
        onClick={() => searchAlbum(searchTerms)}
      >
        <strong>Download with Lidarr</strong>
      </Button>
      {lidarrLoading && <AlbumsLoader />}
      {!lidarrLoading &&
        lidarrResults?.map((album) => (
          <>
            {album?.releases?.map((release, index) => (
              <AlbumCard
                key={`lidarr-album-${index}`}
                release={release}
                album={album}
              />
            ))}
          </>
        ))}
    </>
  );
}
