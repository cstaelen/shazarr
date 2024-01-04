"use client";

import { monitorAlbumLidarr, queryLidarr } from "@/app/server/queryApi";
import { LidarrResultType } from "@/app/types";
import { useState } from "react";

export default function useLidarr() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LidarrResultType[]>();

  const searchAlbum = async (terms: string) => {
    setLoading(true);
    const response = await queryLidarr(terms);
    setResults(response);
    setLoading(false);
  }

  const monitorAlbum = async (albumData: LidarrResultType) => {
    setLoading(true);
    const response = await monitorAlbumLidarr(JSON.stringify(albumData));
    console.log(response);
    setLoading(false);
  }

  return {
    loading,
    results,
    actions: {
        searchAlbum,
        monitorAlbum,
    }
  }
}