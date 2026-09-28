import { FormEvent, useState } from "react";
import { Album, ExpandMore } from "@mui/icons-material";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Drawer,
  FormControlLabel,
  Input,
  Link,
  Paper,
  Stack,
  Switch,
  Typography,
} from "@mui/material";

import lidarrLogo from "../../resources/lidarr.png";
import soulsyncLogo from "../../resources/soulsync.png";
import { useShazarrProvider } from "../Shazarr/useShazarr";

import { ConfigFieldsType } from "./context";
import { useConfigProvider } from "./useConfig";

interface Props {
  open: boolean;
  onClose: () => void;
}

const SERVICE_GROUPS = [
  {
    id: "lidarr",
    name: "Lidarr",
    icon: (
      <img
        src={lidarrLogo}
        alt="Lidarr"
        style={{ width: 24, height: 24, borderRadius: "4px" }}
      />
    ),
    fields: ["lidarr_url", "lidarr_api_key"],
  },
  {
    id: "tidarr",
    name: "Tidarr",
    icon: <Album />,
    fields: ["tidarr_url", "tidarr_api_key"],
  },
  {
    id: "soulsync",
    name: "SoulSync",
    icon: (
      <img
        src={soulsyncLogo}
        alt="SoulSync"
        style={{ width: 24, height: 24, borderRadius: "4px" }}
      />
    ),
    fields: ["soulsync_url", "soulsync_api_key", "soulsync_profile_id"],
  },
  {
    id: "custom",
    name: "Custom Service",
    icon: null,
    fields: ["custom_service_url", "custom_service_name"],
  },
];

const SETTINGS_FIELDS = ["auto_listen_on_launch"];

export default function Config({ open, onClose }: Props) {
  const { recordingStatus } = useShazarrProvider();
  const {
    config,
    formConfig,
    actions: { setConfig },
  } = useConfigProvider();

  const [expanded, setExpanded] = useState<string[]>([]);

  const settingsFields = SETTINGS_FIELDS.map((fieldKey) => {
    const fieldConfig = formConfig?.[fieldKey as keyof typeof formConfig];
    return fieldConfig ? { key: fieldKey, config: fieldConfig } : null;
  }).filter(Boolean) as Array<{
    key: string;
    config: ConfigFieldsType[keyof ConfigFieldsType];
  }>;

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
      soulsync_url: data.get("soulsync_url")?.toString() || "",
      soulsync_api_key: data.get("soulsync_api_key")?.toString() || "",
      soulsync_profile_id: data.get("soulsync_profile_id")?.toString() || "",
      custom_service_url: data.get("custom_service_url")?.toString() || "",
      custom_service_name: data.get("custom_service_name")?.toString() || "",
      auto_listen_on_launch: data.get("auto_listen_on_launch") === "on",
    });
    onClose();
  }

  const handleAccordionChange = (groupId: string) => {
    setExpanded((prev) => {
      const isCurrentlyExpanded =
        prev.includes(groupId);
      if (isCurrentlyExpanded) {
        return prev.filter((id) => id !== groupId);
      } else {
        return [...prev, groupId];
      }
    });
  };

  const isGroupExpanded = (groupId: string) => {
    return expanded.includes(groupId);
  };

  const hasGroupValue = (groupId: string) => {
    const group = SERVICE_GROUPS.find((g) => g.id === groupId);
    if (!group) return false;
    return group.fields.some((field) => config?.[field as keyof typeof config]);
  };

  const renderField = (
    fieldKey: string,
    fieldConfig: ConfigFieldsType[keyof ConfigFieldsType]
  ) => {
    if (fieldConfig.type === "checkbox") {
      return (
        <FormControlLabel
          key={fieldKey}
          sx={{
            marginLeft: 0,
            justifyContent: "space-between",
            width: "100%",
          }}
          labelPlacement="start"
          control={
            <Switch
              name={fieldKey}
              defaultChecked={Boolean(fieldConfig.value)}
            />
          }
          label={fieldConfig.placeholder}
        />
      );
    }

    return (
      <Input
        key={fieldKey}
        name={fieldKey}
        type={fieldConfig.type}
        sx={{ fontSize: "0.925rem" }}
        defaultValue={fieldConfig.value as string | null}
        placeholder={fieldConfig.placeholder}
        fullWidth
      />
    );
  };

  const GenericIcon = () => (
    <Box
      sx={{
        width: 24,
        height: 24,
        backgroundColor: "primary.main",
        borderRadius: "4px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontSize: "12px",
        fontWeight: "bold",
      }}
    >
      S
    </Box>
  );

  return (
    <Drawer
      anchor="bottom"
      open={open}
      onClose={onClose}
      ModalProps={{
        keepMounted: true,
      }}
      sx={{
        "& .MuiPaper-root": {
          maxHeight: "80vh",
        },
      }}
    >
      <Box
        component="form"
        onSubmit={(e) => saveConfig(e)}
        sx={{
          display: "flex",
          flexDirection: "column",
          padding: 1,
          maxWidth: 480,
          width: "100%",
          overflowY: "auto",
        }}
      >
        {SERVICE_GROUPS.map((group) => {
          const groupFields = group.fields
            .map((fieldKey) => {
              const fieldConfig = formConfig[fieldKey as keyof typeof formConfig];
              return fieldConfig ? { key: fieldKey, config: fieldConfig } : null;
            })
            .filter(Boolean) as Array<{
              key: string;
              config: ConfigFieldsType[keyof ConfigFieldsType];
            }>;

          if (groupFields.length === 0) return null;

          const hasValue = hasGroupValue(group.id);
          const isExpanded = isGroupExpanded(group.id);

          return (
            <Box key={group.id} sx={{ marginBottom: 1 }}>
              <Accordion
                expanded={isExpanded}
                onChange={() => handleAccordionChange(group.id)}
                sx={{
                  boxShadow: "none",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 1,
                  "&::before": {
                    display: "none",
                  },
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMore />}
                  sx={{
                    minHeight: "48px",
                    "& .MuiAccordionSummary-content": {
                      margin: 0,
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ width: "100%", alignItems: "center" }}
                  >
                    <Box
                      sx={{
                        width: 24,
                        height: 24,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {group.icon ?? <GenericIcon />}
                    </Box>
                    <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                      {group.name}
                    </Typography>
                    {hasValue && (
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          backgroundColor: "success.main",
                          borderRadius: "50%",
                          right: 5,
                          position: "relative",
                        }}
                      />
                    )}
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <Paper
                    sx={{
                      padding: "0.5rem",
                      border: "none",
                      boxShadow: "none",
                    }}
                  >
                    {groupFields.map((field, index) => (
                      <Box
                        key={field.key}
                        sx={{
                          marginBottom: index < groupFields.length - 1 ? 1 : 0,
                        }}
                      >
                        {renderField(field.key, field.config)}
                      </Box>
                    ))}
                  </Paper>
                </AccordionDetails>
              </Accordion>
            </Box>
          );
        })}

        {settingsFields.length > 0 && (
          <Box sx={{ marginBottom: 1, padding: 1 }}>
            {settingsFields.map((field) => renderField(field.key, field.config))}
          </Box>
        )}

        <Box sx={{ textAlign: "center", paddingBottom: "10px", marginTop: 2 }}>
          <Link
            href="https://github.com/cstaelen/shazarr-app"
            target="_blank"
            rel="noreferrer"
            sx={{ fontSize: 12 }}
          >
            Github page -{" "}
            {import.meta.env.VITE_STAGE === "testing" || import.meta.env.MODE === "development"
              ? "v0.0.0"
              : import.meta.env.VITE_CURRENT_VERSION}
          </Link>
        </Box>
        <Box>
          <Button
            fullWidth
            type="submit"
            variant="contained"
            disabled={recordingStatus !== "inactive"}
          >
            Save configuration
          </Button>
        </Box>
      </Box>
    </Drawer>
  );
}
