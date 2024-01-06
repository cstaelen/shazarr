import { Album, Close, CloseOutlined } from "@mui/icons-material";
import { Button, CircularProgress } from "@mui/material";
import { AlbumsLoader } from "../Skeletons/AlbumsLoader";
import AlbumCard from "./AlbumCard";
import useLidarr from "./useLidarr";

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

  return (
    <>
      <Button
        variant="contained"
        startIcon={
          lidarrLoading ? (
            <CircularProgress size={32} />
          ) : (
            <img src="/lidarr.png" alt="" width="32" height="32" />
          )
        }
        endIcon={lidarrResults && lidarrResults?.length > 0 ? <CloseOutlined /> : undefined}
        disabled={lidarrLoading}
        onClick={() => searchAlbum(searchTerms)}
      >
        <strong>Download with Lidarr</strong>
      </Button>
      {lidarrLoading && <AlbumsLoader />}
      {!lidarrLoading &&
        lidarrResults?.map((album) => (
          <>
            {album?.releases?.map((release) => (
              <AlbumCard
                release={release}
                album={album}
                key={album.foreignAlbumId}
              />
            ))}
          </>
        ))}
    </>
  );
}
