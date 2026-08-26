import { FormEvent } from "react";
import {
  Box,
  Button,
  Drawer,
  FormControlLabel,
  Input,
  Link,
  Paper,
  Switch,
} from "@mui/material";

import { useShazarrProvider } from "../Shazarr/useShazarr";

import { useConfigProvider } from "./useConfig";

interface Props {
  open: boolean;
  onClose: () => void;
}

export default function Config({ open, onClose }: Props) {
  const { recordingStatus } = useShazarrProvider();
  const {
    config,
    formConfig,
    actions: { setConfig },
  } = useConfigProvider();

  if (!formConfig) return null;

  function saveConfig(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    setConfig({
      ...config,
      lidarr_url: data.get("lidarr_url")?.toString() || "",
      lidarr_api_key: data.get("lidarr_api_key")?.toString() || "",
      tidarr_url: data.get("tidarr_url")?.toString() || "",
      tidarr_api_key: data.get("tidarr_api_key")?.toString() || "",
      custom_service_url: data.get("custom_service_url")?.toString() || "",
      custom_service_name: data.get("custom_service_name")?.toString() || "",
      auto_listen_on_launch: data.get("auto_listen_on_launch") === "on",
    });
    onClose();
  }

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true,
      }}
      sx={{
      }}
      >
      <Box
        component="form"
        onSubmit={(e) => saveConfig(e)}
        sx={{
          display: "flex", 
          alignSelf: "center",
          flexDirection: "column",
          padding: 2,
          maxWidth: 480,
          width: "100%",
      }}>
        {Object.entries(formConfig)?.map((field, index) => (
          <Box sx={{ marginBottom: 2 }} key={`form-field-${index}`}>
            <Paper sx={{ padding: "0.5rem" }}>
              {field[1].type === "checkbox" ? (
                <FormControlLabel
                  sx={{
                    marginLeft: 0,
                    justifyContent: "space-between",
                    width: "100%",
                  }}
                  labelPlacement="start"
                  control={
                    <Switch
                      name={field[0]}
                      defaultChecked={Boolean(field[1].value)}
                    />
                  }
                  label={field[1].placeholder}
                />
              ) : (
                <Input
                  name={field[0]}
                  type={field[1].type}
                  sx={{ fontSize: "0.925rem" }}
                  defaultValue={field[1].value as string | null}
                  placeholder={field[1].placeholder}
                  fullWidth
                />
              )}
            </Paper>
          </Box>
        ))}
        <Box sx={{ textAlign: "center", paddingBottom: "10px" }}>
          <Link
            href="https://github.com/cstaelen/shazarr-app"
            target="_blank"
            rel="noreferrer"
            sx={{fontSize: 12}}
          >
            Github page -{" "}
            {import.meta.env.VITE_STAGE === "testing" || import.meta.env.MODE === "development"
              ? "v0.0.0"
              : import.meta.env.VITE_CURRENT_VERSION}
          </Link>
        </Box>
        <Box>
          <Button fullWidth type="submit" variant="contained" disabled={recordingStatus !== "inactive"}>
            Save configuration
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
