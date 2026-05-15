import { useState } from "react";
import styled from "@emotion/styled";
import { List, Settings } from "@mui/icons-material";
import { Box, Fab, useMediaQuery } from "@mui/material";

import Config from "../Config";
import { useConfigProvider } from "../Config/useConfig";
import HistoryList from "../History/List";
import { useHistoryProvider } from "../History/useHistory";
import { useShazarrProvider } from "../Shazarr/useShazarr";

export default function BottomActions() {
  const [configOpen, setConfigOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const { recordingStatus } = useShazarrProvider();
  const { formConfig } = useConfigProvider();
  const { history } = useHistoryProvider();
  const isLandscape = useMediaQuery("(orientation: landscape)");

  const disabled = recordingStatus !== "inactive";

  return (
    <>
      <Config open={configOpen} onClose={() => setConfigOpen(false)} />
      <HistoryList open={historyOpen} onClose={() => setHistoryOpen(false)} />

      <ActionsContainer landscape={isLandscape}>
        {formConfig && (
          <Fab
            size="small"
            color="default"
            onClick={() => setConfigOpen(true)}
            disabled={disabled}
            aria-label="Configuration"
          >
            <Settings />
          </Fab>
        )}
        {history && history.length > 0 && (
          <Fab
            size="small"
            color="default"
            onClick={() => setHistoryOpen(true)}
            disabled={disabled}
            aria-label="Records"
          >
            <List />
          </Fab>
        )}
      </ActionsContainer>
    </>
  );
}

const ActionsContainer = styled(Box)<{ landscape: boolean }>`
  position: fixed;
  z-index: 1000;
  display: flex;
  gap: 24px;

  ${({ landscape }) =>
    landscape
      ? `
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    flex-direction: column;
  `
      : `
    bottom: 40px;
    left: 0;
    right: 0;
    justify-content: center;
    flex-direction: row;
  `}
`;
