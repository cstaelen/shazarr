import { Check, DeleteForever, RemoveRedEye, Search } from "@mui/icons-material";
import { ButtonBase, CardActions, CardMedia, Chip, IconButton, Stack } from "@mui/material";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Typography from "@mui/material/Typography";

import { ImageWithFallback } from "../Common/ImageWithFallback";
import { useShazarrProvider } from "../Shazarr/useShazarr";

import { HistoryItem, SENT_SERVICE_LABELS, SentService } from "./context";
import { useHistoryProvider } from "./useHistory";

export default function HistoryCard({ item }: { item: HistoryItem }) {
  const {
    actions: { searchOfflineRecord, setOpenResultDate },
  } = useShazarrProvider();
  const {
    actions: { deleteHistoryItem },
  } = useHistoryProvider();

  const tagCount = (item.previousDates?.length || 0) + 1;
  const sentServices = Object.keys(item.sentTo || {}) as SentService[];

  function handleClickItem() {
    if (item?.data) {
      setOpenResultDate(item.date);
    } else {
      searchOfflineRecord(item);
    }
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
              height="72"
              width="72"
              alt=""
              src={item?.data?.images?.coverart || ""}
            />
          </ButtonBase>
        </CardMedia>
        <CardContent sx={{ padding: "0.3rem 0.5rem", flex: "1 1 0" }}>
          <ButtonBase
            sx={{ alignItems: "flex-start", flexDirection: "column" }}
            onClick={handleClickItem}
          >
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.2 }}>
              <strong>{item.title}</strong>
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.2 }}>
              {item.artist}
            </Typography>
          </ButtonBase>
          {(tagCount > 1 || sentServices.length > 0) && (
            <Stack direction="row" sx={{ gap: 0.5, flexWrap: "wrap", marginTop: 0.5 }}>
              {tagCount > 1 && (
                <Chip
                  size="small"
                  variant="outlined"
                  label={`×${tagCount}`}
                  aria-label={`Tagged ${tagCount} times`}
                />
              )}
              {sentServices.map((service) => (
                <Chip
                  key={service}
                  size="small"
                  variant="outlined"
                  color="success"
                  icon={<Check />}
                  label={SENT_SERVICE_LABELS[service]}
                  aria-label={`Requested from ${SENT_SERVICE_LABELS[service]}`}
                />
              ))}
            </Stack>
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
