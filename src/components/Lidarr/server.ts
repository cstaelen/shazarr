"use server";

import { ApiReturnType, LidarrResultType } from "../../types";
import { Preferences } from "@capacitor/preferences";

import { SHAZARR_STORE_KEY } from "../../constant";
import { ConfigFieldsType } from "../Config/Provider";

async function getConfigData() {
  const { value: storeData } = await Preferences.get({
    key: SHAZARR_STORE_KEY,
  });

  if (!storeData) return;

  return JSON.parse(storeData) as ConfigFieldsType;
}

async function fetchLidarr(url: string, options?: RequestInit) {
  const store = await getConfigData();
  if (!store) return;

  const baseUrl = store.lidarr_url;

  const opts: RequestInit = {
    ...options,
    cache: "no-cache",
  };

  const response = await fetch(`${baseUrl}${url}`, opts);

  if (!response.ok) {
    return {
      error: true,
      message: `[${new Date().toISOString()}] Query: ${
        response.url
      } - Response: ${response.status} - ${response.statusText}`,
    } as ApiReturnType;
  }

  return response.json();
}

export async function queryLidarr(term: string) {
  const store = await getConfigData();
  if (!store) return;

  const url = `/api/v1/album/lookup?term=${encodeURIComponent(
    term as string,
  )}&apikey=${store.lidarr_api_key}`;

  return await fetchLidarr(url);
}

export async function monitorAlbumLidarr(albumData: LidarrResultType) {
  const store = await getConfigData();
  if (!store) return;

  const data = {
    ...albumData,
    overview: "",
    artist: {
      ...albumData.artist,
      overview: "",
      qualityProfileId: 3,
      rootFolderPath: store.lidarr_library_path,
      addOptions: {
        monitor: "none",
        albumsToMonitor: [albumData.releases[0].foreignReleaseId],
        monitored: false,
        searchForMissingAlbums: false,
      },
    },
    addOptions: {
      addType: "automatic",
      searchForNewAlbum: false,
    },
  };

  const url = `/api/v1/album?apikey=${store.lidarr_api_key}`;

  return await fetchLidarr(url, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  });
}
