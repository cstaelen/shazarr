import styled from "@emotion/styled";
import { Search } from "@mui/icons-material";
import { Button } from "@mui/material";
import { useConfigProvider } from "../../Config/Provider";

export default function CustomServiceButton({
  searchTerms,
  url,
  label,
}: {
  searchTerms: string;
  url: string;
  label: string;
}) {
  const { isNetworkConnected } = useConfigProvider();

  function openTidar() {
    window.open(`${url}${searchTerms}`, "_blank");
  }

  return (
    <Button
      disabled={!isNetworkConnected}
      variant="contained"
      startIcon={<IconStyled />}
      onClick={() => openTidar()}
    >
      <strong>{label}</strong>
    </Button>
  );
}

const IconStyled = styled(Search)`
  font-size: 32px !important;
`;
