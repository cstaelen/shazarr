import { useState } from "react";
import { Close, FilterAlt, FilterAltOff } from "@mui/icons-material";
import { Box, Button, Container, Drawer, Typography, useMediaQuery, useTheme } from "@mui/material";

import { useConfigProvider } from "../Config/useConfig";

import HistoryCard from "./Card";
import { isRequested } from "./context";
import { useHistoryProvider } from "./useHistory";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function HistoryList({ open, onClose }: Props) {
  const isLandscape = useMediaQuery("(orientation: landscape)");
  const { history } = useHistoryProvider();
  const { config } = useConfigProvider();
  const { palette } = useTheme();
  // The setting only decides where the filter starts. Tapping the button holds
  // for the session, and is deliberately not written back to the config.
  const [override, setOverride] = useState<boolean>();
  const hideRequested = override ?? !!config?.hide_requested_by_default;

  if (!history || history?.length === 0) return null;

  const requestedCount = history.filter(isRequested).length;
  const visibleHistory = hideRequested ? history.filter((item) => !isRequested(item)) : history;

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
          {requestedCount > 0 && (
            <Box sx={{ display: "flex", justifyContent: "center", marginBottom: 1 }}>
              <Button
                size="small"
                startIcon={hideRequested ? <FilterAlt /> : <FilterAltOff />}
                onClick={() => setOverride(!hideRequested)}
                aria-pressed={hideRequested}
              >
                {hideRequested
                  ? `Show all (${requestedCount} hidden)`
                  : `Hide requested (${requestedCount})`}
              </Button>
            </Box>
          )}
          {visibleHistory.map((item) => (
            <HistoryCard item={item} key={item.date} />
          ))}
          {visibleHistory.length === 0 && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ padding: 2, textAlign: "center" }}
            >
              Everything has been requested.
            </Typography>
          )}
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
