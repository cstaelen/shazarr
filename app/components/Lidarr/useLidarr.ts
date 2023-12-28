"use client";

import { useState, useEffect } from "react";

export default function useLidarr() {
  const [loading, isLoading] = useState(false);

  const searchAlbum = async (terms: string) => {
    console.log("lidarr search terms", terms);
    const response = await fetch(`${process.env.NEXT_PUBLIC_LIDARR_URL}/api/v1/album/lookup?term=${terms}`, {
        headers: {
            "X-Api-Key": process.env.NEXT_PUBLIC_LIDARR_API_KEY || "",
            "accept": "*/*",
        }
    });
    console.log("lidarr search response", response);
  }

  useEffect(() => {
    
  }, []);

  return {
    loading,
    actions: {
        searchAlbum,
    }
  }
}