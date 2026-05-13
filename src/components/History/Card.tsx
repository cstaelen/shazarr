import { useState } from "react";
import { DeleteForever, RemoveRedEye, Search } from "@mui/icons-material";
import { ButtonBase, CardActions, CardMedia, IconButton } from "@mui/material";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

import { ImageWithFallback } from "../Common/ImageWithFallback";
import ShazarrResults from "../Shazarr/Result";
import { useShazarrProvider } from "../Shazarr/useShazarr";

import { HistoryItem } from "./context";
import { useHistoryProvider } from "./useHistory";

export default function HistoryCard({
  item,
  onClose,
}: {
  item: HistoryItem;
  onClose: () => void;
}) {
  const [resultOpen, setResultOpen] = useState(false);
  const {
    actions: { searchOfflineRecord },
  } = useShazarrProvider();
  const {
    actions: { deleteHistoryItem },
  } = useHistoryProvider();

  const date = new Date(item.date).toUTCString();
  const dateRecord = new Date(date).toLocaleString();

  function handleClickItem() {
    if (item?.data) {
      setResultOpen(true);
    } else {
      searchOfflineRecord(item);
    }
    onClose();
  }

  return (
    <>
      <ShazarrResults
        data={resultOpen ? item.data : undefined}
        onClose={() => setResultOpen(false)}
      />
      <Card
        sx={{ display: "flex", margin: "0 auto 0.5rem", alignItems: "center" }}
        data-testid="history-item"
      >
        <CardMedia sx={{ lineHeight: 0, padding: 1 }}>
          <ButtonBase onClick={handleClickItem}>
            <ImageWithFallback
              height="50"
              width="50"
              alt=""
              src={item?.data?.images?.coverart || ""}
            />
          </ButtonBase>
        </CardMedia>
        <CardContent sx={{ padding: "0.5rem", flex: "1 1 0" }}>
          <ButtonBase sx={{ textAlign: "left" }} onClick={handleClickItem}>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.2 }}>
              <strong>{item.title}</strong> {`- ${item.artist}`}
              <br />
              <small>
                <i>{dateRecord}</i>
              </small>
            </Typography>
          </ButtonBase>
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
