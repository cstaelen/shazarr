"use client";

import { monitorAlbumLidarr, queryLidarr } from "./server";
import { LidarrResultType } from "../../types";
import { useState } from "react";
import { ErrorCodeType } from "../Config/errorCode";
import { useConfigProvider } from "../Config/Provider";

export type LidarrMonitorResponseType = {
  message: string;
  status: "error" | "success" | "warning" | "info";
  description: string;
};

export default function useLidarr() {
  const [loading, setLoading] = useState(false);
  const [lidarrError, setLidarrError] = useState<ErrorCodeType>();
  const [results, setResults] = useState<LidarrResultType[]>();
  const [monitorResponse, setMonitorResponse] =
    useState<LidarrMonitorResponseType>();
  const {
    actions: { addToLogs },
  } = useConfigProvider();
  const searchAlbum = async (terms: string) => {
    if (results && results.length > 0) {
      setResults(undefined);
    } else {
      setLoading(true);

      const response = await queryLidarr(terms);
      if (response.error) {
        addToLogs(`LIDARR_SEARCH_ERROR : ${response.message}`);
        setLidarrError("LIDARR_SEARCH_ERROR");
      } else {
        setResults(response);
      }
      setLoading(false);
    }
  };

  const monitorAlbum = async (albumData: LidarrResultType) => {
    setLoading(true);

    const response = await monitorAlbumLidarr(albumData);

    if (response.error) {
      setLidarrError("LIDARR_MONITOR_ERROR");
    } else {
      let monitorOutput: LidarrMonitorResponseType = {
        message: "An error occured",
        status: "error",
        description: "",
      };

      if (response?.message) {
        monitorOutput = {
          message: response?.message,
          description: response?.description,
          status: "error",
        };
      }
      if (response?.[0]?.severity === "error") {
        monitorOutput = {
          message: `${response?.propertyName}: ${response?.errorMessage}`,
          status: "error",
          description: "",
        };
      }
      if (response?.artistId) {
        monitorOutput = {
          message: "Album added to Lidarr",
          status: "success",
          description: "",
        };
      }

      if (monitorOutput.status === "error") {
        addToLogs(`LIDARR_MONITOR_ERROR : ${monitorOutput.message}`);
      }
      setMonitorResponse(monitorOutput);
    }
    setLoading(false);
  };

  return {
    loading,
    results,
    lidarrError,
    monitorResponse,
    actions: {
      searchAlbum,
      monitorAlbum,
    },
  };
}
