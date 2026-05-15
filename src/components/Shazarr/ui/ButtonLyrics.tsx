import { ExpandMore } from "@mui/icons-material";
import { Accordion, AccordionDetails, AccordionSummary, Box, Typography } from "@mui/material";

export default function ButtonLyrics({ lyrics }: { lyrics: string[] | undefined }) {
  if (!lyrics || lyrics?.length === 0) return null;
  return (
    <Box sx={{ marginTop: 2 }}>
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMore />}
          aria-controls="panel1a-content"
          id="panel1a-header"
        >
          <Typography>LYRICS</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>
            {lyrics?.map((lyric, index) => (
              <span key={`lyric-${index}`}>
                {lyric}
                <br />
              </span>
            ))}
          </Typography>
        </AccordionDetails>
      </Accordion>
    </Box>
  );
}