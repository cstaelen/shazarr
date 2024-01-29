"use client";

import { monitorAlbumLidarr, queryLidarr } from "./server";
import { LidarrResultType } from "../../types";
import { useState } from "react";

export type LidarrMonitorResponseType = {
  message: string;
  status: "error" | "success" | "warning" | "info";
  description: string;
}

export default function useLidarr() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LidarrResultType[]>();
  const [monitorResponse, setMonitorResponse] = useState<LidarrMonitorResponseType>();

  const searchAlbum = async (terms: string) => {
    if (results && results.length > 0) {
      setResults(undefined);
    } else {
      setLoading(true);
      const response = await queryLidarr(terms);
      console.log(response);
      setResults(response);
      setLoading(false);
    }
  }

  const monitorAlbum = async (albumData: LidarrResultType) => {
    setLoading(true);
    const response = await monitorAlbumLidarr(albumData);

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
    setMonitorResponse(monitorOutput);
    setLoading(false);
  }

  return {
    loading,
    results,
    monitorResponse,
    actions: {
        searchAlbum,
        monitorAlbum,
    }
  }
}