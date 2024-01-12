import { Grid, Skeleton } from "@mui/material";
import React from "react";

export const AlbumsLoader = () => {
  return (
    <Grid container rowGap={2}>
      <Grid xs={12} md={6} lg={4} item>
        <Skeleton
          variant="rectangular"
          width={360}
          height={150}
          animation="wave"
        />
      </Grid>
      <Grid xs={12} md={6} lg={4} item>
        <Skeleton
          variant="rectangular"
          width={360}
          height={150}
          animation="wave"
        />
      </Grid>
    </Grid>
  );
};
