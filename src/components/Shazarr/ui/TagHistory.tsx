import { ExpandMore } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from "@mui/material";

export default function TagHistory({
  currentDate,
  previousDates,
}: {
  currentDate: number;
  previousDates: number[];
}) {
  if (!previousDates || previousDates.length === 0) return null;

  const allDates = [currentDate, ...previousDates];

  return (
    <Box sx={{ marginTop: 2 }}>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMore />}
          aria-controls="tag-history-content"
          id="tag-history-header"
        >
          <Typography variant="body2">Tagged {allDates.length} times</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="caption">
            {allDates.map((timestamp) => (
              <span key={timestamp}>
                {new Date(new Date(timestamp).toUTCString()).toLocaleString()}
                <br />
              </span>
            ))}
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
