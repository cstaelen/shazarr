import { Close } from "@mui/icons-material";
import { Box, Button, Container, Drawer, useMediaQuery, useTheme } from "@mui/material";

import HistoryCard from "./Card";
import { useHistoryProvider } from "./useHistory";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function HistoryList({ open, onClose }: Props) {
  const isLandscape = useMediaQuery("(orientation: landscape)");
  const { history } = useHistoryProvider();
  const { palette } = useTheme();

  if (!history || history?.length === 0) return null;

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true,
      }}
    >
      <Box
        sx={{ backgroundImage: palette.background.paper, paddingTop: 1, mb: isLandscape ? 2 : 5 }}
        data-testid="history-list"
      >
        <Container maxWidth="xs" sx={{ padding: "0 0.5rem" }}>
          {history?.map((item, index) => (
            <HistoryCard
              item={item}
              key={`history-item${index}`}
              onClose={onClose}
            />
          ))}
          <Button
            startIcon={<Close />}
            variant="outlined"
            fullWidth
            onClick={onClose}
            sx={{ marginBottom: 1 }}
          >
            Close records
          </Button>
        </Container>
      </Box>
    </Drawer>
  );
}
