import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";
import { DeleteForever, RemoveRedEye, Search } from "@mui/icons-material";
import { CardActions, CardMedia, IconButton } from "@mui/material";
import { ImageWithFallback } from "../Common/ImageWithFallback";
import { useShazarrProvider } from "../Shazarr/Provider";
import { HistoryItem, useHistoryProvider } from "./Provider";

export default function HistoryCard({
  item,
  onClose,
}: {
  item: HistoryItem;
  onClose: () => void;
}) {
  const {
    actions: { setShazarrResponse, searchOfflineRecord },
  } = useShazarrProvider();
  const {
    actions: { deleteHistoryItem },
  } = useHistoryProvider();

  const date = new Date(item.date).toUTCString();
  const dateRecord = new Date(date).toLocaleString();

  return (
    <Card
      sx={{ display: "flex", margin: "0 auto 0.5rem", alignItems: "center" }}
    >
      <CardMedia sx={{ lineHeight: 0, padding: 1 }}>
        <ImageWithFallback
          height="50"
          width="50"
          alt=""
          src={item?.data?.images?.coverart || ""}
        />
      </CardMedia>
      <CardContent sx={{ padding: "0.5rem", flex: "1 1 0", textAlign: "left" }}>
        <Typography variant="body2" color="text.secondary" lineHeight={1.2}>
          <strong>{item.title}</strong> {`- ${item.artist}`}
          <br />
          <small>
            <i>{dateRecord}</i>
          </small>
        </Typography>
      </CardContent>
      <CardActions>
        <IconButton
          onClick={() => {
            if (item?.data) {
              setShazarrResponse(item.data);
            } else {
              searchOfflineRecord(item);
            }
            onClose();
          }}
        >
          {item?.data ? <RemoveRedEye /> : <Search />}
        </IconButton>
        <IconButton
          onClick={() => {
            deleteHistoryItem(item.date);
          }}
        >
          <DeleteForever />
        </IconButton>
      </CardActions>
    </Card>
  );
}
