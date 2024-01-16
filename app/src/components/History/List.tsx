import {
  Box,
  Button,
  Container,
  Drawer,
} from "@mui/material";
import HistoryCard from "./Card";
import { useHistoryProvider } from "./Provider";
import { useState } from "react";
import { List } from "@mui/icons-material";
import styled from "@emotion/styled";
import { useShazarrProvider } from "../Shazarr/Provider";

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
        <StyledBox>
          <Container maxWidth="xs" sx={{ padding: "0 0.5rem" }}>
            {history?.map((item, index) => (
              <HistoryCard
                item={item}
                key={`history-item${index}`}
                onClose={() => setListOpen(false)}
              />
            ))}
          </Container>
        </StyledBox>
      </Drawer>
    </Box>
  );
}

const StyledBox = styled(Box)`
  background: ${({ theme }: any) => theme.palette.background.paper};
  padding-top: 0.5rem;
`;
