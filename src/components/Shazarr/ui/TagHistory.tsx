import { AccessTime, ExpandMore } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from "@mui/material";

const CLOCK_LINE_SX = { display: "flex", alignItems: "center", gap: 0.5 };
/** Sized in `em` so the clock follows whichever text variant it sits next to. */
const CLOCK_SX = { fontSize: "1.15em" };

/** The project's own rounding: `toUTCString` drops the seconds' fraction. */
function formatTagDate(timestamp: number): string {
  return new Date(new Date(timestamp).toUTCString()).toLocaleString();
}

export default function TagHistory({
  currentDate,
  previousDates,
}: {
  currentDate: number;
  previousDates: number[];
}) {
  const allDates = [currentDate, ...(previousDates || [])];

  // One tag has nothing to unfold, so the date is shown plainly rather than
  // hidden behind an accordion — or, as before, not shown at all.
  if (allDates.length === 1)
    return (
      <Box sx={{ marginTop: 2 }}>
        <Typography variant="caption" color="text.secondary" sx={CLOCK_LINE_SX}>
          <AccessTime sx={CLOCK_SX} />
          {`Tagged on ${formatTagDate(currentDate)}`}
        </Typography>
      </Box>
    );

  return (
    <Box sx={{ marginTop: 2 }}>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMore />}
          aria-controls="tag-history-content"
          id="tag-history-header"
        >
          <Typography variant="body2" sx={CLOCK_LINE_SX}>
            <AccessTime sx={CLOCK_SX} />
            {`Tagged ${allDates.length} times`}
          </Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography variant="caption">
            {allDates.map((timestamp) => (
              <span key={timestamp}>
                {formatTagDate(timestamp)}
                <br />
              </span>
            ))}
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}
