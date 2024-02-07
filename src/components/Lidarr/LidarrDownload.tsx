import { CloseOutlined } from "@mui/icons-material";
import { Button, CircularProgress } from "@mui/material";
import { AlbumsLoader } from "../Skeletons/AlbumsLoader";
import AlbumCard from "./AlbumCard";
import useLidarr from "./useLidarr";
import React from "react";
import lidarrLogo from "../../resources/lidarr.png";
import { useConfigProvider } from "../Config/Provider";
import ApiErrorAlert from "../Config/Alert";

export default function LidarrDownload({
  searchTerms,
}: {
  searchTerms: string;
}) {
  const {
    lidarrError,
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
      {lidarrError ? <ApiErrorAlert message={lidarrError} /> : null}
      {!lidarrLoading &&
        lidarrResults &&
        lidarrResults.length > 0 &&
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
