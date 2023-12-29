import * as React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { Avatar, Box, Button, Chip, Link, Stack } from "@mui/material";
import Image from "next/image";
import useLidarr from "./useLidarr";
import { LidarrAlbumRelease, LidarrResultType } from "@/app/types";

export default function AlbumCard({
  album,
  release,
}: {
  album: LidarrResultType;
  release: LidarrAlbumRelease;
}) {
  const { actions } = useLidarr();

  return (
    <Card sx={{ position: "relative" }}>
      <Stack direction="row">
        <Image
          width={120}
          height={120}
          src={album.images?.[0]?.remoteUrl}
          alt="Live from space album cover"
        />
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            flex: "1 1 0",
            position: "relative",
          }}
        >
          <CardContent
            sx={{
              flex: "0 0 auto",
              textAlign: "left",
              paddingBottom: "0 !important",
            }}
          >
            <Box lineHeight={1} marginBottom={1}>
              <Link
                href={`https://musicbrainz.org/release/${release.foreignReleaseId}`}
                target="_blank"
                underline="none"
              >
                <Typography component="span" fontSize="small" fontWeight="bold">
                  {release.title}
                </Typography>
                {` `}
                <small>({release.format})</small>
                <br />
                <small>by{` `}</small>
                <Typography component="span" fontSize="small" fontWeight="bold">
                  {album.artist?.artistName}
                </Typography>
                <OpenInNewIcon
                  style={{
                    verticalAlign: "middle",
                    marginLeft: "0.5rem",
                    fontSize: 16,
                  }}
                />
              </Link>
            </Box>
            <Stack
              direction="row"
              flexWrap="wrap"
              spacing={1}
              style={{ marginBottom: "0.5rem" }}
            >
              <Chip
                label={`${Math.round((release.duration /1000)/60)} min`}
                color="success"
                size="small"
                style={{ margin: "0.2rem" }}
              />
              <Chip
                label={`${release.trackCount} tracks`}
                color="info"
                size="small"
                variant="outlined"
                style={{ margin: "0.2rem" }}
              />
              <Chip
                label={`${new Date(album.releaseDate).getFullYear()}`}
                color="secondary"
                size="small"
                variant="outlined"
                style={{ margin: "0.2rem" }}
              />
            </Stack>
          </CardContent>
        </Box>
      </Stack>
      <Box>
        <Button
          variant="outlined"
          color="primary"
          fullWidth
          onClick={() => actions.monitorAlbum(release.foreignReleaseId)}
        >
          Add to Lidarr
        </Button>
      </Box>
    </Card>
  );
}
