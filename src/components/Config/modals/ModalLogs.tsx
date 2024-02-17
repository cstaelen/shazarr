import { Box, Button, Dialog, DialogContent } from "@mui/material";
import { useState } from "react";
import styled from "@emotion/styled";
import { useConfigProvider } from "../Provider";
import { useShazarrProvider } from "../../Shazarr/Provider";

export default function ModalLogs() {
  const [showLogs, setShowLogs] = useState<boolean>();
  const {
    logs,
    actions: { clearLogs },
  } = useConfigProvider();
  const { recordingStatus } = useShazarrProvider();

  return (
    <>
      <Dialog
        fullWidth
        maxWidth="xs"
        open={!!showLogs}
        onClose={() => setShowLogs(false)}
      >
        <DialogContent sx={{ padding: "0.5rem" }}>
          <Box>
            <LogsContent>
              {logs?.reverse().map((log) => (
                <>
                  {log}
                  <br />
                  -------
                  <br />
                </>
              )) || "No log."}
            </LogsContent>
            <Box>
              <Button
                sx={{
                  marginBottom: 1,
                }}
                fullWidth
                type="submit"
                variant="outlined"
                onClick={() => {
                  clearLogs();
                  setShowLogs(false);
                }}
              >
                Clear logs
              </Button>
              <Button
                fullWidth
                type="submit"
                variant="contained"
                onClick={() => {
                  setShowLogs(false);
                }}
              >
                Close
              </Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
      <ButtonConfig>
        <Button
          onClick={() => setShowLogs(!showLogs)}
          disabled={
            !logs || logs?.length === 0 || recordingStatus !== "inactive"
          }
        >
          Show logs ({(logs && logs.length) || "0"})
        </Button>
      </ButtonConfig>
    </>
  );
}

const ButtonConfig = styled.div`
  margin-bottom: 0.5rem;
`;
const LogsContent = styled.code`
  background: #212121;
  color: #fff;
  display: block;
  font-size: 12px;
  height: 400px;
  line-height: 1.2em;
  margin-bottom: 10px;
  padding: 10px;
  overflow: auto;
`;
