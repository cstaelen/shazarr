import { useState } from "react";
import { Close, List } from "@mui/icons-material";
import { Box, Button, Container, Drawer, useTheme } from "@mui/material";

import { useShazarrProvider } from "../Shazarr/Provider";

import HistoryCard from "./Card";
import { useHistoryProvider } from "./Provider";

export default function HistoryList() {
  const { recordingStatus } = useShazarrProvider();
  const { history } = useHistoryProvider();
  const [listOpen, setListOpen] = useState<boolean>();
  const { palette } = useTheme();

  if (!history || history?.length === 0) return null;

  return (
    <Box marginBottom={2}>
      <Button
        startIcon={<List />}
        variant="outlined"
        fullWidth
        onClick={() => setListOpen(true)}
        disabled={recordingStatus !== "inactive"}
      >
        Show records ({history?.length})
      </Button>
      <Drawer
        anchor="bottom"
        open={listOpen}
        onClose={() => setListOpen(false)}
        ModalProps={{
          keepMounted: true,
        }}
      >
        <Box
          sx={{ backgroundImage: palette.background.paper, paddingTop: 1 }}
          data-testid="history-list"
        >
          <Container maxWidth="xs" sx={{ padding: "0 0.5rem" }}>
            {history?.map((item, index) => (
              <HistoryCard
                item={item}
                key={`history-item${index}`}
                onClose={() => setListOpen(false)}
              />
            ))}
            <Button
              startIcon={<Close />}
              variant="outlined"
              fullWidth
              onClick={() => setListOpen(false)}
              sx={{ marginBottom: 1 }}
            >
              Close records
            </Button>
          </Container>
        </Box>
      </Drawer>
    </Box>
  );
}
