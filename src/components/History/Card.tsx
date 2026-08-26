import { useState } from "react";
import { DeleteForever, RemoveRedEye, Search } from "@mui/icons-material";
import { ButtonBase, CardActions, CardMedia, Collapse, IconButton } from "@mui/material";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

import { ImageWithFallback } from "../Common/ImageWithFallback";
import { useShazarrProvider } from "../Shazarr/useShazarr";

import { HistoryItem } from "./context";
import { useHistoryProvider } from "./useHistory";

function formatDate(timestamp: number) {
  return new Date(new Date(timestamp).toUTCString()).toLocaleString();
}

export default function HistoryCard({
  item,
}: {
  item: HistoryItem;
}) {
  const [showPreviousDates, setShowPreviousDates] = useState(false);
  const {
    actions: { searchOfflineRecord, setOpenResultDate },
  } = useShazarrProvider();
  const {
    actions: { deleteHistoryItem },
  } = useHistoryProvider();

  const dateRecord = formatDate(item.date);
  const previousDates = item.previousDates || [];

  function handleClickItem() {
    if (item?.data) {
      setOpenResultDate(item.date);
    } else {
      searchOfflineRecord(item);
    }
  }

  function handleTogglePreviousDates(event: React.MouseEvent) {
    event.stopPropagation();
    setShowPreviousDates((prev) => !prev);
  }

  return (
    <>
      <Card
        sx={{ display: "flex", margin: "0 auto 0.5rem", alignItems: "center" }}
        data-testid="history-item"
      >
        <CardMedia sx={{ lineHeight: 0 }}>
          <ButtonBase onClick={handleClickItem}>
            <ImageWithFallback
              height="60"
              width="60"
              alt=""
              src={item?.data?.images?.coverart || ""}
            />
          </ButtonBase>
        </CardMedia>
        <CardContent sx={{ padding: "0.3rem 0.5rem", flex: "1 1 0" }}>
          <ButtonBase sx={{ textAlign: "left", display: "block", width: "100%" }} onClick={handleClickItem}>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.2 }}>
              <strong>{item.title}</strong> {`- ${item.artist}`}
              <br />
              <small>
                <i>{dateRecord}</i>
              </small>
            </Typography>
          </ButtonBase>
          {!!previousDates.length && (
            <>
              <ButtonBase onClick={handleTogglePreviousDates}>
                <Typography variant="body2" color="text.secondary">
                  <small>
                    &middot; tagged {previousDates.length + 1} times
                  </small>
                </Typography>
              </ButtonBase>
              <Collapse in={showPreviousDates}>
                <Typography variant="body2" color="text.secondary" component="div">
                  {previousDates.map((timestamp) => (
                    <small key={timestamp}>
                      <i>{formatDate(timestamp)}</i>
                      <br />
                    </small>
                  ))}
                </Typography>
              </Collapse>
            </>
          )}
        </CardContent>
        <CardActions>
          <IconButton onClick={handleClickItem}>
            {item?.data ? <RemoveRedEye /> : <Search />}
          </IconButton>
          <IconButton onClick={() => deleteHistoryItem(item.date)}>
            <DeleteForever />
          </IconButton>
        </CardActions>
      </Card>
    </>
  );
}
