import { Box, Button, Drawer } from "@mui/material";
import HistoryCard from "./HistoryCard";
import { useHistoryProvider } from "./HistoryProvider";
import { useState } from "react";
import { List } from "@mui/icons-material";
import styled from "@emotion/styled";
import { useShazarrProvider } from "../Shazarr/ShazarrProvider";

export default function HistoryList() {
  const { recordingStatus } = useShazarrProvider();
  const { history } = useHistoryProvider();
  const [listOpen, setListOpen] = useState<boolean>();

  if (!history || history?.length === 0 || recordingStatus !== "inactive")
    return null;

  return (
    <Box marginBottom={2}>
      <Button
        startIcon={<List />}
        variant="outlined"
        fullWidth
        onClick={() => setListOpen(true)}
      >
        Last records ({history?.length})
      </Button>
      <Drawer
        anchor="bottom"
        open={listOpen}
        onClose={() => setListOpen(false)}
        ModalProps={{
          keepMounted: true,
        }}
      >
        <StyledBox padding={1}>
          {history?.map((item, index) => (
            <HistoryCard
              item={item}
              key={`history-item${index}`}
              onClose={() => setListOpen(false)}
            />
          ))}
        </StyledBox>
      </Drawer>
    </Box>
  );
}

const StyledBox = styled(Box)(() => ({
  backgroundColor: "grey[800]",
}));
